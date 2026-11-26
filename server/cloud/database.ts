import pg, { type PoolClient } from 'pg'

let pool: pg.Pool | undefined

export function database() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL')
  pool ??= new pg.Pool({
    connectionString: url, max: 3, connectionTimeoutMillis: 5_000, idleTimeoutMillis: 10_000, allowExitOnIdle: true,
  })
  return pool
}

export async function transaction<T>(run: (client: PoolClient) => Promise<T>) {
  const client = await database().connect()
  try {
    await client.query('BEGIN')
    const result = await run(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
