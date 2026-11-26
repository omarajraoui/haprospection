import { createHash } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { request } from 'node:https'
import { setTimeout as delay } from 'node:timers/promises'
import { load } from 'cheerio'
import ipaddr from 'ipaddr.js'
import { sourceKind } from '../src/source-quality.ts'
import type { Lead, Search } from '../src/prospects.ts'

export type Task = {
  kind: 'search' | 'page'
  input: string
  state: 'queued' | 'complete' | 'failed'
  attempts?: number
  detail?: string
}

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
  return ['', ' entreprise catalogue'].map(suffix => ({
    kind: 'search', input: `${search.product} ${search.market} ${search.role}${suffix}`, state: 'queued',
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

function tokens(value: string) {
  const words = value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').match(/[a-z0-9]{4,}/g) ?? []
  return words.map(word => word.length > 4 ? word.replace(/s$/, '') : word)
}

export function qualifyPage(input: string, html: string, product: string, role = ''): Lead | undefined {
  const url = publicUrl(input)
  const kind = sourceKind(url.href)
  if (kind === 'directory' || kind === 'registry') return undefined
  const $ = load(html)
  $('script, style, template, noscript, nav, footer').remove()
  const candidates = $('h1, h2, h3, p, li').toArray()
  const terms = new Set(tokens(product))
  if (!terms.size) return undefined
  const excerpts = candidates.map(element => $(element).text().replace(/\s+/g, ' ').trim().slice(0, 360))
  const roleTerms = tokens(role).map(word => word.slice(0, 6))
  const eligible = excerpts.flatMap(text => {
    const words = tokens(text)
    const matched = new Set(words.filter(token => terms.has(token)))
    if (text.length < 12 || matched.size < Math.min(2, terms.size)) return []
    const roleMention = words.some(word => roleTerms.some(term => word.startsWith(term)))
    return [{ text, score: matched.size * 2 + Number(roleMention) * 3 + Number(text.length > 45) }]
  })
  eligible.sort((first, second) => second.score - first.score)
  const excerpt = eligible[0]?.text
  if (!excerpt) return undefined
  const domain = url.hostname.replace(/^www\./, '')
  const name = ($('meta[property="og:site_name"]').attr('content') || domain).trim().slice(0, 120) || domain
  return {
    id: createHash('sha256').update(domain).digest('hex').slice(0, 24),
    name,
    status: 'unverified',
    contact: null,
    reason: 'Une page mentionne des termes du produit. Confirmez l’entreprise, son activité et le marché avant d’approuver.',
    evidence: [{
      field: 'Mention du produit',
      source: domain,
      url: url.href,
      excerpt,
      observedAt: new Date().toISOString().slice(0, 10),
      live: true,
    }],
  }
}
