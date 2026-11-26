import { randomUUID } from 'node:crypto'
import { discoveryProviders, processDiscoveryTask, type DiscoveryPayload } from '../discovery-task.ts'
import { database, transaction } from './database.ts'
import type { StoredSession } from './workspace.ts'

type Job = { owner: string; id: string; state: StoredSession & DiscoveryPayload }

export async function processQueuedTask(key: string, providers = discoveryProviders) {
  const job = await transaction(async client => {
    const result = await client.query<Job>(`
      SELECT owner, id, state FROM ha_prospection.sessions
      WHERE state->>'mode' = 'live' AND COALESCE((state #>> '{lease,expires}')::bigint, 0) < $1
        AND jsonb_path_exists(state, '$.tasks[*] ? (@.state == "queued")')
      ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
    `, [Date.now()])
    const job = result.rows[0]
    if (!job) return null
    const task = job.state.tasks.find(item => item.state === 'queued')
    if (!task) return null
    task.attempts = (task.attempts ?? 0) + 1
    job.state.lease = { token: randomUUID(), expires: Date.now() + 30_000 }
    await client.query('UPDATE ha_prospection.sessions SET state = $3 WHERE owner = $1 AND id = $2',
      [job.owner, job.id, job.state])
    return { ...job, task, token: job.state.lease.token }
  })
  if (!job) return false

  await processDiscoveryTask(job.state, job.task, key, providers)
  delete job.state.lease
  await database().query(`
    UPDATE ha_prospection.sessions SET state = $3
    WHERE owner = $1 AND id = $2 AND state #>> '{lease,token}' = $4
  `, [job.owner, job.id, job.state, job.token])
  return true
}
