import manifest from '../package.json' with { type: 'json' }
import { currentOwner, login, logout } from '../server/cloud/auth.ts'
import {
  addSource, changeLead, listSources, retrySearch, sessions, startSearch,
} from '../server/cloud/workspace.ts'
import { RequestError } from '../server/validation.ts'
import { shortlistWorkbook } from '../server/workbook.ts'

function json(body: unknown, status = 200, headers?: Record<string, string>) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', ...headers } })
}

function verifyOrigin(request: Request, url: URL) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host') ?? url.host
  const local = /^(?:localhost|127\.0\.0\.1)(?::[0-9]+)?$/.test(host)
  if (origin !== `https://${host}` && !(local && origin === `http://${host}`)) {
    throw new RequestError(403, 'Origine non autorisée.')
  }
}

async function readBody(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    throw new RequestError(415, 'Un corps JSON est requis.')
  }
  if (Number(request.headers.get('content-length')) > 8192) throw new RequestError(413, 'Requête trop volumineuse.')
  const text = await request.text()
  if (Buffer.byteLength(text) > 8192) throw new RequestError(413, 'Requête trop volumineuse.')
  let value: unknown
  try { value = JSON.parse(text) } catch { throw new RequestError(400, 'Requête JSON invalide.') }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError(400, 'Requête JSON invalide.')
  return value as Record<string, unknown>
}

function cloudConfigured() {
  return [process.env.DATABASE_URL, process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.HAPROSPECTION_CLIENT_EMAIL].every(value => value?.trim())
}

export async function handleWorkspace(
  request: Request, { scheduledResearch = Boolean(process.env.CRON_SECRET) } = {},
) {
  const searchEnabled = () => Boolean(process.env.BRAVE_SEARCH_API_KEY?.trim() && scheduledResearch)
  const url = new URL(request.url)
  const { method } = request
  const path = url.pathname === '/api/workspace'
    ? url.searchParams.get('route') ?? ''
    : url.pathname.replace(/^\/api\//, '')
  try {
    if (method === 'POST' || method === 'PUT') verifyOrigin(request, url)
    if (path === 'auth/login' && method === 'POST') {
      const cookie = await login(await readBody(request))
      return json({ authenticated: true }, 200, { 'Set-Cookie': cookie })
    }
    if (path === 'auth/logout' && method === 'POST') {
      return json({ authenticated: false }, 200, { 'Set-Cookie': await logout(request) })
    }
    if (path === 'auth/status' && method === 'GET' && !cloudConfigured()) {
      return json({ hosted: true, authenticated: false, configured: false })
    }
    const owner = await currentOwner(request)
    if (path === 'auth/status' && method === 'GET') return json({ hosted: true, authenticated: Boolean(owner) })
    if (!owner) throw new RequestError(401, 'Connectez-vous pour ouvrir votre espace.')

    if (path === 'discovery' && method === 'GET') {
      return json({ enabled: searchEnabled(), version: manifest.version, logPath: '' })
    }
    if (path === 'sessions' && method === 'GET') return json(await sessions(owner))
    if (path === 'sources' && method === 'GET') return json(await listSources(owner))
    if (path === 'sources' && method === 'POST') return json(await addSource(owner, await readBody(request)), 201)
    if (path === 'sessions' && method === 'POST') {
      if (!searchEnabled()) throw new RequestError(503, 'Le service de recherche web est à connecter.')
      return json(await startSearch(owner, await readBody(request)), 201)
    }
    if (path === 'shortlist/export.xlsx' && method === 'GET') {
      const workbook = await shortlistWorkbook(await sessions(owner))
      return new Response(Uint8Array.from(Buffer.from(workbook)), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="ha-prospection.xlsx"',
          'Cache-Control': 'private, no-store',
        },
      })
    }
    const retry = path.match(/^sessions\/([a-f0-9-]+)\/retry$/)
    if (retry && method === 'POST') {
      if (!searchEnabled()) throw new RequestError(503, 'Le service de recherche web est à connecter.')
      return json(await retrySearch(owner, retry[1]))
    }
    const lead = path.match(/^sessions\/([a-f0-9-]+)\/leads\/([a-z0-9-]+)\/(review|evidence|follow-up)$/)
    if (lead && method === 'PUT') {
      return json(await changeLead(owner, lead[1], lead[2], lead[3], await readBody(request)))
    }
    return json({ error: 'Route introuvable.' }, 404)
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status)
    console.error('Workspace request failed:', error instanceof Error ? error.name : 'Unknown error')
    return json({ error: 'Le service est temporairement indisponible.' }, 503)
  }
}

export default {
  fetch(request: Request) {
    return handleWorkspace(request)
  },
}
