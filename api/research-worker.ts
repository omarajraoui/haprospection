import { timingSafeEqual } from 'node:crypto'
import { processResearchBatch } from '../server/cloud/worker.ts'

export async function handleResearchWorker(request: Request) {
  const secret = process.env.CRON_SECRET
  const expected = Buffer.from(`Bearer ${secret ?? ''}`)
  const received = Buffer.from(request.headers.get('authorization') ?? '')
  if (request.method !== 'GET' || !secret || received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return new Response(null, { status: 401 })
  }
  const processed = await processResearchBatch(45_000)
  return Response.json({ processed }, { headers: { 'Cache-Control': 'no-store' } })
}
export default { fetch: handleResearchWorker }
