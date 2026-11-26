import preparedCatalogue from './prepared-catalogue.json' with { type: 'json' }
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import { type Lead, type Evidence } from '../src/prospects.ts'
import { decisions, type Session, type Review, type Source, type FollowUp } from '../src/research.ts'

import { discoveryTasks, retryFailedTasks } from './discovery.ts'
import { discoveryWorker } from './discovery-worker.ts'
import { shortlistWorkbook } from './workbook.ts'

class RequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

async function readJson(request: IncomingMessage) {
  const origin = request.headers.origin
  if (origin && origin !== `http://${request.headers.host}`) {
    throw new RequestError(403, 'Origine non autorisée.')
  }
  if (request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') {
    throw new RequestError(415, 'Un corps JSON est requis.')
  }
  const chunks: Buffer[] = []
  let bytes = 0
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length
    if (bytes > 8192) {
      request.resume()
      throw new RequestError(413, 'Requête trop volumineuse.')
    }
    chunks.push(chunk)
  }
  try {
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString())
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as Record<string, unknown>
    }
  } catch {
    // Invalid JSON receives the same response as a non-object value.
  }
  throw new RequestError(400, 'Requête JSON invalide.')
}

function field(value: unknown, maximum: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new RequestError(400, `Saisissez une valeur de 1 à ${maximum} caractères.`)
  }
  return value.trim()
}

function dateField(value: unknown, optional = false) {
  if (optional && value === '') return ''
  const date = field(value, 10)
  const timestamp = Date.parse(date)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(timestamp)
    || new Date(timestamp).toISOString().slice(0, 10) !== date) {
    throw new RequestError(400, 'Saisissez une date valide.')
  }
  return date
}

function sourceUrl(value: unknown) {
  try {
    const url = new URL(field(value, 2048))
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href
  } catch {
    // Malformed URLs and unsupported URL schemes share the same message.
  }
  throw new RequestError(400, 'Saisissez une URL HTTP ou HTTPS valide.')
}

type SessionRow = {
  id: string
  payload: string
}

function createHandler(database: DatabaseSync, searchKey: string, version: string) {
  const listSessions = database.prepare(`
    SELECT id, payload FROM sessions
    WHERE json_extract(payload, '$.mode') IN ('live', 'prepared')
    ORDER BY rowid DESC
  `)
  const updateSession = database.prepare('UPDATE sessions SET payload = ? WHERE id = ? AND payload = ?')
  const findSession = database.prepare(`
    SELECT id, payload FROM sessions WHERE id = ? AND json_extract(payload, '$.mode') IN ('live', 'prepared')
  `)
  const insertSession = database.prepare('INSERT INTO sessions (id, payload) VALUES (?, ?)')
  const listReviews = database.prepare(`
    SELECT lead_id, decision, reason, reviewed_at AS reviewedAt, evidence_revision
    FROM reviews WHERE session_id = ? ORDER BY id
  `)
  const insertReview = database.prepare(`
    INSERT INTO reviews (session_id, lead_id, decision, reason, reviewed_at, evidence_revision)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const listSources = database.prepare('SELECT id, name, url, type, added_at AS addedAt FROM sources ORDER BY name, id')
  const findSource = database.prepare('SELECT id FROM sources WHERE id = ?')
  const insertSource = database.prepare('INSERT INTO sources (id, name, url, type, added_at) VALUES (?, ?, ?, ?, ?)')
  const listEvidence = database.prepare(`
    SELECT e.id, e.lead_id, e.field, e.excerpt, e.observed_at AS observedAt, s.name AS source, s.url, s.type AS sourceType
    FROM manual_evidence e JOIN sources s ON s.id = e.source_id
    WHERE e.session_id = ? ORDER BY e.id
  `)
  const evidenceRevision = database.prepare(`
    SELECT COALESCE(MAX(id), 0) AS revision FROM manual_evidence WHERE session_id = ? AND lead_id = ?
  `)
  const insertEvidence = database.prepare(`
    INSERT INTO manual_evidence (session_id, lead_id, source_id, field, excerpt, observed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const listFollowUps = database.prepare('SELECT lead_id, owner, date FROM follow_ups WHERE session_id = ?')
  const upsertFollowUp = database.prepare(`
    INSERT INTO follow_ups (session_id, lead_id, owner, date) VALUES (?, ?, ?, ?)
    ON CONFLICT (session_id, lead_id) DO UPDATE SET owner = excluded.owner, date = excluded.date
  `)

  function serialize(row: SessionRow): Session {
    const { lease: _lease, ...session } = JSON.parse(row.payload) as
      Omit<Session, 'id' | 'reviews' | 'followUps'> & { lease?: unknown }
    const reviews: Session['reviews'] = {}
    const followUps: Session['followUps'] = {}
    const revisions = new Map<string, number>()
    for (const { lead_id, ...claim } of listEvidence.all(row.id) as unknown as
      (Evidence & { id: number; lead_id: string })[]) {
      session.leads.find(lead => lead.id === lead_id)?.evidence.push({ ...claim, manual: true })
      revisions.set(lead_id, claim.id)
    }
    for (const entry of listReviews.all(row.id) as unknown as
      (Review & { lead_id: string; evidence_revision: number })[]) {
      const invalidated = entry.decision === 'approved'
        && entry.evidence_revision !== (revisions.get(entry.lead_id) ?? 0)
      reviews[entry.lead_id] = invalidated ? undefined : {
        decision: entry.decision, reason: entry.reason, reviewedAt: entry.reviewedAt,
      }
    }
    for (const { lead_id, owner, date } of listFollowUps.all(row.id) as (FollowUp & { lead_id: string })[]) {
      followUps[lead_id] = { owner, date }
    }
    return { id: row.id, ...session, reviews, followUps }
  }

  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const path = request.url?.split('?')[0]
    if (!path?.startsWith('/api/')) return next()

    function send(status: number, body: unknown) {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      response.end(JSON.stringify(body))
    }

    try {
      if (!/^(?:127\.0\.0\.1|localhost)(?::[0-9]+)?$/.test(request.headers.host ?? '')) {
        throw new RequestError(403, 'Accès réservé à cette machine.')
      }
      if (path === '/api/discovery' && request.method === 'GET') {
        return send(200, {
          enabled: Boolean(searchKey), version, logPath: process.env.HAPROSPECTION_LOG_PATH ?? '',
        })
      }
      if (path === '/api/sessions' && request.method === 'GET') {
        return send(200, (listSessions.all() as SessionRow[]).map(serialize))
      }
      if (path === '/api/sessions' && request.method === 'POST') {
        const body = await readJson(request)
        const search = {
          product: field(body.product, 100), market: field(body.market, 100), role: field(body.role, 100),
        }
        if (body.mode !== 'live') throw new RequestError(400, 'La recherche utilise uniquement des sources web.')
        if (!searchKey) throw new RequestError(503, 'Le service de recherche web est à connecter.')
        const id = randomUUID()
        const payload = {
          search, mode: 'live', createdAt: new Date().toISOString(), tasks: discoveryTasks(search), leads: [],
        }
        insertSession.run(id, JSON.stringify(payload))
        return send(201, { id, ...payload, reviews: {}, followUps: {} })
      }
      const retry = path.match(/^\/api\/sessions\/([a-f0-9-]+)\/retry$/)
      if (retry && request.method === 'POST') {
        await readJson(request)
        if (!searchKey) throw new RequestError(503, 'Clé de recherche manquante.')
        const row = findSession.get(retry[1]) as SessionRow | undefined
        if (!row) throw new RequestError(404, 'Session introuvable.')
        const payload = JSON.parse(row.payload) as Session & { retried?: boolean }
        if (payload.retried || !payload.tasks || !retryFailedTasks(payload.tasks)) {
          throw new RequestError(409, 'Cette session ne peut pas être relancée.')
        }
        payload.retried = true
        const next = JSON.stringify(payload)
        if (!updateSession.run(next, row.id, row.payload).changes) {
          throw new RequestError(409, 'La session a changé. Réessayez.')
        }
        return send(200, serialize({ id: row.id, payload: next }))
      }
      if (path === '/api/sources' && request.method === 'GET') return send(200, listSources.all())
      if (path === '/api/sources' && request.method === 'POST') {
        const body = await readJson(request)
        const source: Source = {
          id: randomUUID(), name: field(body.name, 120), url: sourceUrl(body.url),
          type: field(body.type, 80), addedAt: new Date().toISOString(),
        }
        insertSource.run(source.id, source.name, source.url, source.type, source.addedAt)
        return send(201, source)
      }
      if (path === '/api/shortlist/export.xlsx' && request.method === 'GET') {
        const workbook = await shortlistWorkbook((listSessions.all() as SessionRow[]).map(serialize))
        response.writeHead(200, {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="ha-prospection.xlsx"',
          'Cache-Control': 'no-store',
        })
        return response.end(Buffer.from(workbook))
      }
      const match = path.match(/^\/api\/sessions\/([a-f0-9-]+)\/leads\/([a-z0-9-]+)\/(review|evidence|follow-up)$/)
      if (match && request.method === 'PUT') {
        const [, sessionId, leadId, action] = match
        const body = await readJson(request)
        const row = findSession.get(sessionId) as SessionRow | undefined
        if (!row) throw new RequestError(404, 'Session introuvable.')
        const session = serialize(row)
        if (!session.leads.some(lead => lead.id === leadId)) throw new RequestError(404, 'Prospect introuvable.')

        if (action === 'review') {
          const decision = body.decision
          if (typeof decision !== 'string' || !Object.hasOwn(decisions, decision)) {
            throw new RequestError(400, 'Décision inconnue.')
          }
          const reason = field(body.reason, 500)
          const revision = Number(evidenceRevision.get(sessionId, leadId)?.revision)
          insertReview.run(sessionId, leadId, decision, reason, new Date().toISOString(), revision)
        } else if (action === 'evidence') {
          const sourceId = field(body.sourceId, 36)
          if (!findSource.get(sourceId)) throw new RequestError(404, 'Source introuvable.')
          insertEvidence.run(sessionId, leadId, sourceId, field(body.field, 120),
            field(body.excerpt, 2000), dateField(body.observedAt))
        } else {
          if (session.reviews[leadId]?.decision !== 'approved') {
            throw new RequestError(409, 'Approuvez le prospect avant de modifier le suivi.')
          }
          if (typeof body.owner !== 'string' || body.owner.trim().length > 120) {
            throw new RequestError(400, 'Le responsable doit comporter au maximum 120 caractères.')
          }
          upsertFollowUp.run(sessionId, leadId, body.owner.trim(), dateField(body.date, true))
        }
        return send(200, serialize(row))
      }
      return send(404, { error: 'Route introuvable.' })
    } catch (error) {
      if (error instanceof RequestError) return send(error.status, { error: error.message })
      console.error(error)
      return send(500, { error: 'La base locale est indisponible.' })
    }
  }
}

export function localApi(version: string): Plugin {
  const install = (server: ViteDevServer | PreviewServer) => {
    const directory = resolve(process.env.HAPROSPECTION_DATA_DIR || 'data')
    mkdirSync(directory, { recursive: true })
    const database = new DatabaseSync(resolve(directory, 'prospection.sqlite'))
    database.exec(`
      PRAGMA busy_timeout = 5000;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        lead_id TEXT NOT NULL,
        decision TEXT NOT NULL CHECK (decision IN ('approved', 'flagged', 'dismissed')),
        reason TEXT NOT NULL,
        reviewed_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS reviews_by_session ON reviews(session_id, id);
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        added_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS manual_evidence (
        id INTEGER PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id),
        lead_id TEXT NOT NULL,
        source_id TEXT NOT NULL REFERENCES sources(id),
        field TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        observed_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS manual_evidence_by_lead ON manual_evidence(session_id, lead_id, id);
      CREATE TABLE IF NOT EXISTS follow_ups (
        session_id TEXT NOT NULL REFERENCES sessions(id),
        lead_id TEXT NOT NULL,
        owner TEXT NOT NULL,
        date TEXT NOT NULL,
        PRIMARY KEY (session_id, lead_id)
      );
    `)
    database.exec('BEGIN IMMEDIATE')
    try {
      const columns = database.prepare('PRAGMA table_info(reviews)').all()
      if (!columns.some(column => column.name === 'evidence_revision')) {
        database.exec('ALTER TABLE reviews ADD COLUMN evidence_revision INTEGER NOT NULL DEFAULT 0')
      }
      database.exec('COMMIT')
    } catch (error) {
      database.exec('ROLLBACK')
      database.close()
      throw error
    }
    const catalogueId = '803dfe4c-e447-4894-a16a-8accc64af456'
    database.prepare('INSERT INTO sessions (id, payload) VALUES (?, ?) ON CONFLICT (id) DO NOTHING')
      .run(catalogueId, JSON.stringify(preparedCatalogue))
    const key = process.env.BRAVE_SEARCH_API_KEY?.trim() ?? ''
    const stop = key ? discoveryWorker(database, key) : undefined
    server.middlewares.use(createHandler(database, key, version))
    server.httpServer?.once('close', () => { stop?.(); database.close() })
  }
  return { name: 'ha-prospection-local-api', configureServer: install, configurePreviewServer: install }
}
