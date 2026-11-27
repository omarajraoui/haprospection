import type { Opportunity, OpportunityFeed } from '../src/corridor-data.ts'

const codes = ['15240000', '15241000', '15241300', '15241400', '15241500', '15241600']
const fields = ['publication-number', 'notice-title', 'deadline-receipt-tender-date-lot', 'buyer-name', 'classification-cpv',
  'notice-type', 'publication-date', 'organisation-country-buyer', 'BT-21-Lot']
const publicationDays = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
let inFlight: Promise<OpportunityFeed> | undefined
let cached: { value: OpportunityFeed; until: number } | undefined

function texts(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(texts)
  if (typeof value === 'object' && value) return Object.values(value).flatMap(texts)
  return []
}

function label(value: unknown) {
  if (typeof value === 'object' && value && 'fra' in value) {
    const [french] = texts(value.fra)
    if (french) return french
  }
  return texts(value)[0] ?? null
}

function isoDate(value: string) {
  const date = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (!date) return undefined
  const timestamp = Date.parse(date)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date ? date : undefined
}

export function activeTedNotices(notices: unknown[], today: string): Opportunity[] {
  const unique = new Map<string, Opportunity>()
  for (const item of notices) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const row = item as Record<string, unknown>
    const id = row['publication-number']
    const relevant = [...new Set(texts(row['classification-cpv']).filter(code => codes.includes(code)))]
    const dates = texts(row['deadline-receipt-tender-date-lot']).map(isoDate)
    const deadline = dates[0]
    if (typeof id !== 'string' || !/^\d{1,8}-\d{4}$/.test(id) || !relevant.length
      || !texts(row['organisation-country-buyer']).includes('FRA')
      || !['cn-standard', 'cn-social', 'cn-desg', 'subco'].includes(String(row['notice-type']))
      || !deadline || deadline <= today || !dates.every(date => date === deadline)) continue

    unique.set(id, {
      id, title: label(row['notice-title']) ?? `Avis TED ${id}`, buyer: label(row['buyer-name']),
      deadline, published: isoDate(texts(row['publication-date'])[0] ?? '') ?? null, codes: relevant,
      lotTitles: [...new Set(texts(row['BT-21-Lot']).filter(title =>
        /sardine|maquereau|anchois|\bthon\b|conserves? de poisson/i.test(title)))].slice(0, 5),
      url: `https://ted.europa.eu/fr/notice/-/detail/${id}`,
    })
  }
  return [...unique.values()].sort((first, second) => first.deadline.localeCompare(second.deadline))
}

export async function fetchTedOpportunities(): Promise<OpportunityFeed> {
  if (cached && Date.now() < cached.until) return cached.value
  if (inFlight) return inFlight
  inFlight = (async () => {
    const response = await fetch('https://api.ted.europa.eu/v3/notices/search', {
      method: 'POST', signal: AbortSignal.timeout(8000), redirect: 'error',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query: `(${codes.map(code => `classification-cpv = ${code}`).join(' OR ')}) AND organisation-country-buyer = FRA SORT BY publication-date DESC`,
        fields, scope: 'ACTIVE', page: 1, limit: 40,
      }),
    })
    if (!response.ok) throw new Error(`TED HTTP ${response.status}`)
    const data: { notices?: unknown[]; timedOut?: boolean } = await response.json()
    if (!Array.isArray(data.notices) || data.timedOut) throw new Error('Réponse TED incomplète.')
    const now = new Date()
    const parts = Object.fromEntries(publicationDays.formatToParts(now).map(part => [part.type, part.value]))
    const today = `${parts.year}-${parts.month}-${parts.day}`
    const value = { checkedAt: now.toISOString(), opportunities: activeTedNotices(data.notices, today) }
    cached = { value, until: Date.now() + 300_000 }
    return value
  })().finally(() => { inFlight = undefined })
  return inFlight
}
