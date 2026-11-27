import { sourceKind } from '../src/source-quality.ts'
import type { Session } from '../src/research.ts'
import { braveSearch, qualifyPage, readPublicPage, type Task } from './discovery.ts'
import { applyRegistryCheck, lookupFrenchCompany } from './registry.ts'

export const discoveryProviders = { search: braveSearch, readPage: readPublicPage, registry: lookupFrenchCompany }
export type DiscoveryProviders = Pick<typeof discoveryProviders, 'search' | 'readPage'>
  & Partial<Pick<typeof discoveryProviders, 'registry'>>

export type DiscoveryPayload = Omit<Session, 'id' | 'reviews' | 'followUps'> & {
  tasks: Task[]
  lease?: { token: string; expires: number }
}

export async function processDiscoveryTask(
  payload: DiscoveryPayload, task: Task, key: string, providers: DiscoveryProviders = discoveryProviders,
) {
  try {
    if (task.kind === 'search') {
      const urls = await providers.search(task.input, key)
      const known = new Set(payload.tasks.filter(item => item.kind === 'page').map(item => item.input))
      for (const input of urls) {
        if (known.has(input) || known.size >= 10) continue
        payload.tasks.push({ kind: 'page', input, state: 'queued' })
        known.add(input)
      }
      task.detail = `${urls.length} page(s) retournée(s)`
    } else if (task.kind === 'registry') {
      const lead = payload.leads.find(item => item.id === task.leadId)
      if (!lead?.qualification || lead.qualification.siren !== task.input) {
        task.detail = 'Vérification devenue sans objet.'
      } else {
        const registry = providers.registry ?? lookupFrenchCompany
        applyRegistryCheck(lead, await registry(task.input))
        task.detail = lead.reason
      }
    } else {
      const kind = sourceKind(task.input)
      if (kind === 'directory' || kind === 'registry') {
        task.detail = kind === 'directory' ? 'Annuaire : piste à recouper.' : 'Registre : à consulter pour vérifier une entreprise.'
      } else {
        const lead = qualifyPage(task.input, await providers.readPage(task.input), payload.search.product, payload.search.role, payload.search.market)
        if (lead) {
          const existing = payload.leads.find(item => item.id === lead.id)
          if (!existing) {
            payload.leads.push(lead)
          } else if (!payload.retried && existing.qualification && lead.qualification) {
            const current = existing.qualification
            const next = lead.qualification
            if (current.siren && next.siren && current.siren !== next.siren) {
              task.detail = 'Page écartée : autre identifiant légal sur le même domaine.'
              task.state = 'complete'
              return
            }
            const newSiren = !current.siren && next.siren
            const newContact = !existing.contact && lead.contact
            const newSignal = (next.roleMention && !current.roleMention)
              || (next.marketMention && !current.marketMention)
              || (next.origin?.mentioned && !current.origin?.mentioned)
            if (newSiren || newContact || newSignal) {
              for (const claim of lead.evidence) {
                if (!existing.evidence.some(item => item.url === claim.url && item.field === claim.field)) {
                  existing.evidence.push(claim)
                }
              }
              if (newSiren) {
                current.siren = newSiren
                current.identity = 'pending'
                existing.name = lead.name
              }
              if (newContact) existing.contact = newContact
              current.roleMention ||= next.roleMention
              current.marketMention ||= next.marketMention
              if (current.origin && next.origin?.mentioned) current.origin.mentioned = true
            }
          }
          const candidate = existing ?? lead
          const siren = candidate.qualification?.siren
          if (siren && candidate.qualification?.identity === 'pending'
            && !payload.tasks.some(item => item.kind === 'registry' && item.leadId === candidate.id)) {
            payload.tasks.push({ kind: 'registry', input: siren, leadId: candidate.id, state: 'queued' })
          }
        }
        task.detail = lead ? 'Mention pertinente trouvée' : 'Aucune mention exploitable'
      }
    }
    task.state = 'complete'
  } catch (error) {
    task.state = 'failed'
    task.detail = error instanceof Error ? error.message.slice(0, 180) : 'Source indisponible'
  }
}
