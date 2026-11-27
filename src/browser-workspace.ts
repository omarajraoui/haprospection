import preparedCatalogue from '../server/prepared-catalogue.json'
import { dateField, field, sourceUrl } from '../server/validation'
import { decisions, type Decision, type Session, type Source } from './research'

const storageKey = 'ha-prospection-browser-workspace-v1'
const catalogueId = '803dfe4c-e447-4894-a16a-8accc64af456'

type Workspace = { session: Session; sources: Source[] }

function readWorkspace(): Workspace {
  const saved = localStorage.getItem(storageKey)
  if (saved) return JSON.parse(saved) as Workspace
  return {
    session: {
      ...(structuredClone(preparedCatalogue) as Omit<Session, 'id' | 'reviews' | 'followUps'>),
      id: catalogueId, reviews: {}, followUps: {},
    },
    sources: [],
  }
}

function persist(workspace: Workspace) {
  localStorage.setItem(storageKey, JSON.stringify(workspace))
}

export function browserRequest(path: string, method: string, input: object | undefined, version: string): unknown {
  if (path === '/api/discovery') return { enabled: false, version, logPath: '' }
  const workspace = readWorkspace()
  const { session, sources } = workspace
  const body = (input ?? {}) as Record<string, unknown>
  if (path === '/api/sessions' && method === 'GET') return [session]
  if (path === '/api/sources' && method === 'GET') return sources
  if (path === '/api/sources' && method === 'POST') {
    const source: Source = {
      id: crypto.randomUUID(), name: field(body.name, 120), url: sourceUrl(body.url),
      type: field(body.type, 80), addedAt: new Date().toISOString(),
    }
    sources.push(source)
    sources.sort((first, second) => first.name.localeCompare(second.name, 'fr'))
    persist(workspace)
    return source
  }
  const match = path.match(/^\/api\/sessions\/([^/]+)\/leads\/([^/]+)\/(review|evidence|follow-up)$/)
  if (match && method === 'PUT') {
    const [, sessionId, leadId, action] = match
    const lead = sessionId === session.id && session.leads.find(item => item.id === leadId)
    if (!lead) throw new Error('Prospect introuvable.')
    if (action === 'review') {
      if (typeof body.decision !== 'string' || !Object.hasOwn(decisions, body.decision)) throw new Error('Décision inconnue.')
      session.reviews[leadId] = {
        decision: body.decision as Decision, reason: field(body.reason, 500), reviewedAt: new Date().toISOString(),
      }
    } else if (action === 'evidence') {
      const source = sources.find(item => item.id === body.sourceId)
      if (!source) throw new Error('Source introuvable.')
      lead.evidence.push({
        id: lead.evidence.length + 1, manual: true, source: source.name, url: source.url, sourceType: source.type,
        field: field(body.field, 120), excerpt: field(body.excerpt, 2000), observedAt: dateField(body.observedAt),
      })
      if (session.reviews[leadId]?.decision === 'approved') delete session.reviews[leadId]
    } else {
      if (session.reviews[leadId]?.decision !== 'approved') throw new Error('Approuvez le prospect avant de modifier le suivi.')
      if (typeof body.owner !== 'string' || body.owner.trim().length > 120) throw new Error('Responsable invalide.')
      session.followUps[leadId] = { owner: body.owner.trim(), date: dateField(body.date, true) }
    }
    persist(workspace)
    return session
  }
  throw new Error('La recherche web demande la configuration du service hébergé.')
}

export async function downloadBrowserWorkbook() {
  const { shortlistWorkbook } = await import('../server/workbook')
  const workbook = await shortlistWorkbook([readWorkspace().session])
  const bytes = Uint8Array.from(new Uint8Array(workbook))
  const url = URL.createObjectURL(new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'ha-prospection.xlsx' })
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
