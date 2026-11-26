import { createHash, randomBytes } from 'node:crypto'
import { database } from './database.ts'
import { field, RequestError } from '../validation.ts'

const cookieName = '__Host-ha-session'
const maxAge = 7 * 24 * 60 * 60
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function hash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function sessionCookie(token: string, seconds: number) {
  return `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`
}

function tokenFrom(request: Request) {
  const match = request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-ha-session=([0-9a-f]{64})(?:;|$)/)
  return match?.[1]
}

export async function currentOwner(request: Request) {
  const token = tokenFrom(request)
  if (!token) return null
  const result = await database().query<{ owner: string }>(
    'SELECT owner FROM ha_prospection.auth_sessions WHERE token_hash = $1 AND expires_at > now()', [hash(token)],
  )
  return result.rows[0]?.owner ?? null
}

export async function login(body: Record<string, unknown>) {
  const email = field(body.email, 254).toLowerCase()
  const password = body.password
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  const allowed = process.env.HAPROSPECTION_CLIENT_EMAIL?.trim().toLowerCase()
  if (!url || !key || !allowed) throw new RequestError(503, 'La connexion est en cours de configuration.')
  if (email !== allowed || typeof password !== 'string' || !password || password.length > 1024) {
    throw new RequestError(401, 'E-mail ou mot de passe incorrect.')
  }
  const result = await fetch(new URL('/auth/v1/token?grant_type=password', url), {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(8000),
    redirect: 'error',
  })
  if (result.status === 429) throw new RequestError(429, 'Trop de tentatives. Réessayez dans quelques instants.')
  if (result.status >= 500) throw new RequestError(503, 'La connexion est temporairement indisponible.')
  if (!result.ok) throw new RequestError(401, 'E-mail ou mot de passe incorrect.')
  const data = await result.json() as { user?: { id: string; email?: string } }
  if (!data.user || !uuid.test(data.user.id) || data.user.email?.toLowerCase() !== allowed) {
    throw new RequestError(401, 'Compte non autorisé.')
  }

  const token = randomBytes(32).toString('hex')
  await database().query('DELETE FROM ha_prospection.auth_sessions WHERE expires_at <= now()')
  await database().query('INSERT INTO ha_prospection.auth_sessions VALUES ($1, $2, $3)',
    [hash(token), data.user.id, new Date(Date.now() + maxAge * 1000)])
  return sessionCookie(token, maxAge)
}

export async function logout(request: Request) {
  const token = tokenFrom(request)
  if (token) await database().query('DELETE FROM ha_prospection.auth_sessions WHERE token_hash = $1', [hash(token)])
  return sessionCookie('', 0)
}
