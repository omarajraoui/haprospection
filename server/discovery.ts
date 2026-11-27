import { createHash } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { request } from 'node:https'
import { setTimeout as delay } from 'node:timers/promises'
import { load } from 'cheerio'
import ipaddr from 'ipaddr.js'
import { sourceKind } from '../src/source-quality.ts'
import type { Lead, Search } from '../src/prospects.ts'
import type { DiscoveryTask } from '../src/research.ts'

export type Task = DiscoveryTask

export function retryFailedTasks(tasks: Task[]) {
  if (!tasks.some(task => task.state === 'failed') || tasks.some(task => task.state === 'queued')) return false
  for (const task of tasks) {
    if (task.state === 'failed') {
      task.state = 'queued'
      delete task.detail
    }
  }
  return true
}

export function discoveryTasks(search: Search): Task[] {
  const criteria = `${search.product} ${search.market}`
  const alternative = search.role === 'Fournisseurs' ? 'fabricant exportateur catalogue'
    : search.role === 'Acheteurs' ? 'approvisionnement acheteur professionnel'
    : 'grossiste importateur catalogue'
  return [`${criteria} ${search.role}`, `${criteria} ${alternative}`].map(input => ({
    kind: 'search', input, state: 'queued',
  }))
}

export async function braveSearch(query: string, key: string): Promise<string[]> {
  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.search = new URLSearchParams({ q: query, count: '5', safesearch: 'strict' }).toString()
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Subscription-Token': key },
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Brave Search · HTTP ${response.status}`)
  const data = await response.json() as { web?: { results?: { url?: unknown }[] } }
  const links = data.web?.results ?? []
  if (!Array.isArray(links)) throw new Error('Réponse du moteur invalide.')
  return links.slice(0, 5).flatMap(result => {
    if (typeof result?.url !== 'string' || result.url.length > 2048) return []
    try {
      const url = publicUrl(result.url)
      url.hash = ''
      for (const name of [...url.searchParams.keys()]) {
        if (name.startsWith('utm_') || ['gclid', 'fbclid'].includes(name)) url.searchParams.delete(name)
      }
      url.searchParams.sort()
      return [url.href]
    } catch {
      return []
    }
  })
}

function publicUrl(input: string) {
  const url = new URL(input)
  if (url.protocol !== 'https:' || url.username || url.password || url.port
    || !url.hostname.includes('.') || url.hostname.endsWith('.')) {
    throw new Error('Adresse HTTPS publique requise.')
  }
  return url
}

export async function readPublicPage(input: string) {
  const url = publicUrl(input)
  const signal = AbortSignal.timeout(8000)
  const dnsTimer = new AbortController()
  const addresses = await Promise.race([
    lookup(url.hostname, { all: true }),
    delay(8000, undefined, { signal: dnsTimer.signal }).then(() => { throw new Error('Résolution DNS trop lente.') }),
  ]).finally(() => dnsTimer.abort())
  if (!addresses.length || addresses.some(({ address }) => {
    const parsed = ipaddr.process(address)
    return parsed.range() !== 'unicast'
      || (parsed instanceof ipaddr.IPv6 && !parsed.match(ipaddr.IPv6.parse('2000::'), 3))
  })) {
    throw new Error('Adresse réseau non publique.')
  }
  const pinned = addresses[0]
  return new Promise<string>((resolve, reject) => {
    const outgoing = request(url, {
      signal,
      family: pinned.family,
      lookup: (_hostname, _options, callback) => callback(null, pinned.address, pinned.family),
      headers: { Accept: 'text/html', 'User-Agent': 'HA-Prospection/0.4' },
      agent: false,
    }, response => {
      const contentType = response.headers['content-type'] ?? ''
      if (response.statusCode !== 200 || !/^text\/html\b/i.test(contentType)) {
        response.destroy()
        reject(new Error(`Page HTML indisponible · HTTP ${response.statusCode ?? '?'}`))
        return
      }
      const chunks: Buffer[] = []
      let size = 0
      response.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > 750_000) {
          reject(new Error('Page trop volumineuse.'))
          response.destroy()
        } else chunks.push(chunk)
      })
      response.on('error', reject)
      response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
    outgoing.on('error', reject)
    outgoing.end()
  })
}

export function normalized(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

const stopWords = new Set(['les', 'des', 'une', 'avec', 'pour', 'sans', 'and', 'the', 'produit', 'produits'])

function tokens(value: string) {
  const words = normalized(value).split(/\s+/).filter(word => word.length >= 3 && !stopWords.has(word))
  return words.map(word => word.length > 4 ? word.replace(/s$/, '') : word)
}

function pageSiren(text: string) {
  const ids = new Set<string>()
  for (const match of text.matchAll(/\b(SIRET|SIREN)\s*[:n°º.\-]*\s*((?:\d[ .]*){9,14})(?![ .]*\d)/gi)) {
    const digits = match[2].replace(/\D/g, '')
    if (digits.length === (match[1].toUpperCase() === 'SIRET' ? 14 : 9)) ids.add(digits.slice(0, 9))
  }
  return ids.size === 1 ? [...ids][0] : undefined
}

function rolePattern(role: string) {
  const target = normalized(role)
  if (target.includes('fournisseur')) return /\b(fournisseur|fabricant|producteur|exportateur)s?\b/
  if (target.includes('acheteur')) return /\b(service achats|responsable achats|approvisionnement|acheteurs?)\b/
  if (target.includes('importateur') || target.includes('distributeur')) {
    return /\b(importateur|distributeur|grossiste)s?\b/
  }
  return undefined
}

function mentions(text: string, term: string) {
  return term !== '' && ` ${normalized(text)} `.includes(` ${normalized(term)} `)
}

export function qualifyPage(input: string, html: string, product: string, role = '', market = ''): Lead | undefined {
  const url = publicUrl(input)
  const kind = sourceKind(url.href)
  if (kind === 'directory' || kind === 'registry') return undefined
  const $ = load(html)
  $('script, style, template, noscript').remove()
  const domain = url.hostname.replace(/^www\./, '')
  const publishedPurchasingEmail = $('a[href^="mailto:"]').toArray()
    .map(element => $(element).attr('href')?.slice(7).split('?')[0].trim().toLowerCase())
    .find(address => address && /^(achats?|purchasing|procurement)@[a-z0-9.-]+$/.test(address)
      && address.split('@')[1] === domain)
  // The footer can carry the official identifier, but should not rank as a product excerpt.
  const siren = normalized(market) === 'france' ? (() => {
    $('p, div, li, td, footer, section, address, br').before(' ').after(' ')
    return pageSiren($('body').text().replace(/\s+/g, ' '))
  })() : undefined
  $('nav, footer').remove()

  // Keep the product terms distinct from country of origin in the prepared trade corridor.
  const originMatch = product.match(/\s+(?:du|d['’]|de)\s*(Maroc|France|Espagne|Sénégal)\s*$/i)
  const origin = originMatch?.[1]
  const terms = [...new Set(tokens(originMatch ? product.slice(0, originMatch.index) : product))]
  if (!terms.length) return undefined
  const rolePredicate = rolePattern(role)
  const eligible = $('h1, h2, h3, p, li').toArray().flatMap(element => {
    const text = $(element).text().replace(/\s+/g, ' ').trim().slice(0, 360)
    const words = new Set(tokens(text))
    if (text.length < 12 || !terms.every(term => words.has(term))) return []
    const roleMention = rolePredicate?.test(normalized(text)) ?? false
    const marketMention = mentions(text, market)
    const originMention = origin ? mentions(text, origin) : false
    return [{ text, roleMention, marketMention, originMention,
      score: Number(roleMention) * 4 + Number(marketMention) * 2 + Number(originMention) + Number(text.length > 45) }]
  })
  eligible.sort((first, second) => second.score - first.score)
  const best = eligible[0]
  if (!best) return undefined
  const name = ($('meta[property="og:site_name"]').attr('content') || domain).trim().slice(0, 120) || domain
  return {
    id: createHash('sha256').update(domain).digest('hex').slice(0, 24),
    name,
    status: 'unverified',
    contact: publishedPurchasingEmail ?? null,
    qualification: {
      identity: siren ? 'pending' : 'unverified', siren,
      roleMention: best.roleMention, marketMention: best.marketMention,
      origin: origin ? { requested: origin, mentioned: best.originMention } : undefined,
    },
    reason: 'Produit mentionné sur la page. Vérifiez l’activité, le débouché et le bon interlocuteur avant de prendre contact.',
    evidence: [{
      field: 'Mention du produit',
      source: domain,
      url: url.href,
      excerpt: best.text,
      observedAt: new Date().toISOString().slice(0, 10),
      live: true,
    }, ...(siren ? [{
      field: 'Identifiant publié par le site', source: domain, url: url.href,
      excerpt: `Le site publie le SIREN ${siren} ou un SIRET rattaché à cet identifiant.`,
      observedAt: new Date().toISOString().slice(0, 10), live: true, paraphrased: true,
    }] : []), ...(publishedPurchasingEmail ? [{
      field: 'Adresse publique du service achats', source: domain, url: url.href, excerpt: publishedPurchasingEmail,
      observedAt: new Date().toISOString().slice(0, 10), live: true,
    }] : [])],
  }
}
