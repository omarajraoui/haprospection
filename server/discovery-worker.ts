import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { discoveryProviders, processDiscoveryTask, type DiscoveryPayload } from './discovery-task.ts'

export function discoveryWorker(database: DatabaseSync, key: string, providers = discoveryProviders) {
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
      const payload = JSON.parse(row.payload) as DiscoveryPayload
      const task = payload.tasks.find(item => item.state === 'queued')
      if (!task) return

      task.attempts = (task.attempts ?? 0) + 1
      payload.lease = { token: randomUUID(), expires: Date.now() + 30_000 }
      const claimed = JSON.stringify(payload)
      if (!update.run(claimed, row.id, row.payload).changes) return
      await processDiscoveryTask(payload, task, key, providers)
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
