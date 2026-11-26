import { timingSafeEqual } from 'node:crypto'
import { processQueuedTask } from '../server/cloud/worker.ts'

export async function handleResearchWorker(request: Request) {
  const secret = process.env.CRON_SECRET
  const expected = Buffer.from(`Bearer ${secret ?? ''}`)
  const received = Buffer.from(request.headers.get('authorization') ?? '')
  if (request.method !== 'GET' || !secret || received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return new Response(null, { status: 401 })
  }
  const key = process.env.BRAVE_SEARCH_API_KEY?.trim()
  if (!key) return Response.json({ processed: 0 }, { headers: { 'Cache-Control': 'no-store' } })
  const deadline = Date.now() + 45_000
  let processed = 0
  while (Date.now() < deadline && processed < 12 && await processQueuedTask(key)) processed++
  return Response.json({ processed }, { headers: { 'Cache-Control': 'no-store' } })
}
export default { fetch: handleResearchWorker }
