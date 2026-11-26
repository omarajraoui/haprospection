import { sourceKind } from '../src/source-quality.ts'
import type { Session } from '../src/research.ts'
import { braveSearch, qualifyPage, readPublicPage, type Task } from './discovery.ts'

export const discoveryProviders = { search: braveSearch, readPage: readPublicPage }

export type DiscoveryPayload = Omit<Session, 'id' | 'reviews' | 'followUps'> & {
  tasks: Task[]
  lease?: { token: string; expires: number }
}

export async function processDiscoveryTask(
  payload: DiscoveryPayload, task: Task, key: string, providers = discoveryProviders,
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
    } else {
      const kind = sourceKind(task.input)
      if (kind === 'directory' || kind === 'registry') {
        task.detail = kind === 'directory' ? 'Annuaire : piste à recouper.' : 'Registre : à consulter pour vérifier une entreprise.'
      } else {
        const lead = qualifyPage(task.input, await providers.readPage(task.input), payload.search.product, payload.search.role)
        if (lead) {
          const existing = payload.leads.find(item => item.id === lead.id)
          // The first readable URL remains the evidence of record for this candidate.
          if (!existing) payload.leads.push(lead)
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
