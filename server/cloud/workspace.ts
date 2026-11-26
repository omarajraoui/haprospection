import { randomUUID } from 'node:crypto'
import type { PoolClient } from 'pg'
import preparedCatalogue from '../prepared-catalogue.json' with { type: 'json' }
import { decisions, type Decision, type Review, type Session, type Source } from '../../src/research.ts'
import { dateField, field, RequestError, sourceUrl } from '../validation.ts'
import { discoveryTasks, retryFailedTasks } from '../discovery.ts'
import { database, transaction } from './database.ts'
import { uuid } from './auth.ts'

const catalogueId = '803dfe4c-e447-4894-a16a-8accc64af456'

export type StoredSession = Session & {
  lease?: { token: string; expires: number }
  reviewHistory?: (Review & { leadId: string })[]
}

export function publicSession(state: StoredSession): Session {
  const { lease: _lease, reviewHistory: _history, ...session } = state
  return session
}

async function insertSession(owner: string, session: Session) {
  await database().query(`
    INSERT INTO ha_prospection.sessions (owner, id, state, created_at)
    VALUES ($1, $2, $3, $4) ON CONFLICT (owner, id) DO NOTHING
  `, [owner, session.id, session, session.createdAt])
}

export async function sessions(owner: string): Promise<Session[]> {
  await insertSession(owner, {
    ...(preparedCatalogue as Omit<Session, 'id' | 'reviews' | 'followUps'>),
    id: catalogueId, reviews: {}, followUps: {},
  })
  const result = await database().query<{ state: StoredSession }>(
    'SELECT state FROM ha_prospection.sessions WHERE owner = $1 ORDER BY created_at DESC, id', [owner],
  )
  return result.rows.map(({ state }) => publicSession(state))
}

export async function startSearch(owner: string, body: Record<string, unknown>) {
  if (body.mode !== 'live') throw new RequestError(400, 'La recherche utilise uniquement des sources web.')
  const search = { product: field(body.product, 100), market: field(body.market, 100), role: field(body.role, 100) }
  const session: Session = {
    id: randomUUID(), mode: 'live', search, tasks: discoveryTasks(search), leads: [],
    createdAt: new Date().toISOString(), reviews: {}, followUps: {},
  }
  // Serializing requests from a single account prevents parallel submissions from multiplying paid searches.
  return transaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [owner])
    const pending = await client.query(`
      SELECT 1 FROM ha_prospection.sessions
      WHERE owner = $1 AND jsonb_path_exists(state, '$.tasks[*] ? (@.state == "queued")') LIMIT 1
    `, [owner])
    if (pending.rowCount) throw new RequestError(409, 'Une recherche est déjà en cours.')
    await client.query('INSERT INTO ha_prospection.sessions VALUES ($1, $2, $3, $4)',
      [owner, session.id, session, session.createdAt])
    return session
  })
}

export async function listSources(owner: string) {
  const result = await database().query<{ details: Source }>(
    "SELECT details FROM ha_prospection.sources WHERE owner = $1 ORDER BY details->>'name', id", [owner],
  )
  return result.rows.map(({ details }) => details)
}

export async function addSource(owner: string, body: Record<string, unknown>) {
  const source: Source = {
    id: randomUUID(), name: field(body.name, 120), url: sourceUrl(body.url), type: field(body.type, 80),
    addedAt: new Date().toISOString(),
  }
  await database().query('INSERT INTO ha_prospection.sources VALUES ($1, $2, $3)', [owner, source.id, source])
  return source
}

async function updateSession(owner: string, id: string, change: (state: StoredSession, client: PoolClient) => Promise<void> | void) {
  if (!uuid.test(id)) throw new RequestError(404, 'Session introuvable.')
  return transaction(async client => {
    const result = await client.query<{ state: StoredSession }>(
      'SELECT state FROM ha_prospection.sessions WHERE owner = $1 AND id = $2 FOR UPDATE', [owner, id],
    )
    const state = result.rows[0]?.state
    if (!state) throw new RequestError(404, 'Session introuvable.')
    await change(state, client)
    await client.query('UPDATE ha_prospection.sessions SET state = $3 WHERE owner = $1 AND id = $2', [owner, id, state])
    return publicSession(state)
  })
}

export function retrySearch(owner: string, id: string) {
  return updateSession(owner, id, state => {
    if (state.mode !== 'live' || state.retried || !state.tasks || !retryFailedTasks(state.tasks)) {
      throw new RequestError(409, 'Cette session ne peut pas être relancée.')
    }
    state.retried = true
  })
}

export function changeLead(owner: string, id: string, leadId: string, action: string, body: Record<string, unknown>) {
  return updateSession(owner, id, async (state, client) => {
    const lead = state.leads.find(item => item.id === leadId)
    if (!lead) throw new RequestError(404, 'Prospect introuvable.')
    if (state.tasks?.some(task => task.state === 'queued')) {
      throw new RequestError(409, 'La recherche est encore en cours.')
    }

    if (action === 'review') {
      const decision = body.decision
      if (typeof decision !== 'string' || !Object.hasOwn(decisions, decision)) {
        throw new RequestError(400, 'Décision inconnue.')
      }
      const review = { decision: decision as Decision, reason: field(body.reason, 500), reviewedAt: new Date().toISOString() }
      state.reviews[leadId] = review
      const history = state.reviewHistory ??= []
      history.push({ leadId, ...review })
    } else if (action === 'evidence') {
      const sourceId = field(body.sourceId, 36)
      if (!uuid.test(sourceId)) throw new RequestError(404, 'Source introuvable.')
      const result = await client.query<{ details: Source }>(
        'SELECT details FROM ha_prospection.sources WHERE owner = $1 AND id = $2', [owner, sourceId],
      )
      const source = result.rows[0]?.details
      if (!source) throw new RequestError(404, 'Source introuvable.')
      lead.evidence.push({
        id: lead.evidence.length + 1, manual: true,
        source: source.name, url: source.url, sourceType: source.type,
        field: field(body.field, 120), excerpt: field(body.excerpt, 2000), observedAt: dateField(body.observedAt),
      })
      if (state.reviews[leadId]?.decision === 'approved') delete state.reviews[leadId]
    } else {
      if (state.reviews[leadId]?.decision !== 'approved') {
        throw new RequestError(409, 'Approuvez le prospect avant de modifier le suivi.')
      }
      if (typeof body.owner !== 'string' || body.owner.trim().length > 120) {
        throw new RequestError(400, 'Le responsable doit comporter au maximum 120 caractères.')
      }
      state.followUps[leadId] = { owner: body.owner.trim(), date: dateField(body.date, true) }
    }
  })
}
