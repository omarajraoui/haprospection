import { processResearchBatch } from '../../server/cloud/worker.ts'

export const config = { schedule: '* * * * *' }

export default async function researchWorker() {
  const processed = await processResearchBatch(18_000)
  return Response.json({ processed }, { headers: { 'Cache-Control': 'no-store' } })
}
