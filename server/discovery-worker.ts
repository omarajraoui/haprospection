import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type { Session } from '../src/research.ts'
import { braveSearch, qualifyPage, readPublicPage, type Task } from './discovery.ts'

type Payload = Omit<Session, 'id' | 'reviews' | 'followUps'> & {
  tasks: Task[]
  lease?: { token: string; expires: number }
}

export function discoveryWorker(database: DatabaseSync, key: string, providers = {
  search: braveSearch, readPage: readPublicPage,
}) {
  const queue = database.prepare(`
    SELECT id, payload FROM sessions
    WHERE json_extract(payload, '$.mode') = 'live'
      AND COALESCE(json_extract(payload, '$.lease.expires'), 0) < ?
      AND EXISTS (SELECT 1 FROM json_each(payload, '$.tasks') WHERE json_extract(value, '$.state') = 'queued')
    ORDER BY rowid LIMIT 1
  `)
  const update = database.prepare('UPDATE sessions SET payload = ? WHERE id = ? AND payload = ?')
  let timer: ReturnType<typeof setTimeout>
  let stopped = false

  async function work() {
    try {
      const row = queue.get(Date.now()) as { id: string; payload: string } | undefined
      if (!row) return
      const payload = JSON.parse(row.payload) as Payload
      const task = payload.tasks.find(item => item.state === 'queued')
      if (!task) return

      task.attempts = (task.attempts ?? 0) + 1
      payload.lease = { token: randomUUID(), expires: Date.now() + 30_000 }
      const claimed = JSON.stringify(payload)
      if (!update.run(claimed, row.id, row.payload).changes) return
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
          const lead = qualifyPage(task.input, await providers.readPage(task.input), payload.search.product)
          if (lead) {
            const existing = payload.leads.find(item => item.id === lead.id)
            // Preserve reviewed evidence on existing leads. The initial readable URL is the evidence of record.
            if (!existing) payload.leads.push(lead)
          }
          task.detail = lead ? 'Mention pertinente trouvée' : 'Aucune mention exploitable'
        }
        task.state = 'complete'
      } catch (error) {
        task.state = 'failed'
        task.detail = error instanceof Error ? error.message.slice(0, 180) : 'Source indisponible'
      }
      delete payload.lease
      if (!stopped) update.run(JSON.stringify(payload), row.id, claimed)
    } catch (error) {
      if (!stopped) console.error(error)
    } finally {
      if (!stopped) timer = setTimeout(() => void work(), 500)
    }
  }

  timer = setTimeout(() => void work(), 500)
  return () => { stopped = true; clearTimeout(timer) }
}
