import type { Lead, Search } from './prospects'

export const decisions = {
  approved: 'Retenu',
  flagged: 'Signalé',
  dismissed: 'Écarté',
} as const

export type Decision = keyof typeof decisions

export type Review = {
  decision: Decision
  reason: string
  reviewedAt: string
}

export type DiscoveryTask = {
  kind: 'search' | 'page' | 'registry'
  input: string
  leadId?: string
  state: 'queued' | 'complete' | 'failed'
  attempts?: number
  detail?: string
}

export function canApproveLead(lead: Lead) {
  return lead.qualification?.identity !== 'conflict'
}

export type Session = {
  id: string
  search: Search
  mode: 'live' | 'prepared'
  retried?: boolean
  tasks?: DiscoveryTask[]
  createdAt: string
  leads: Lead[]
  reviews: Record<string, Review | undefined>
  followUps: Record<string, FollowUp | undefined>
}

export function appendPreparedLeads(current: Lead[], prepared: Lead[]) {
  const ids = new Set(current.map(lead => lead.id))
  const additions = prepared.filter(lead => !ids.has(lead.id))
  return additions.length ? [...current, ...additions] : current
}

export type Source = {
  id: string
  name: string
  url: string
  type: string
  addedAt: string
}

export type FollowUp = {
  owner: string
  date: string
}

export type EvidenceInput = {
  sourceId: string
  field: string
  excerpt: string
  observedAt: string
}

export function approvedLeads(sessions: Session[]) {
  return sessions.flatMap(session =>
    session.leads.filter(lead => canApproveLead(lead) && session.reviews[lead.id]?.decision === 'approved')
      .map(lead => ({ session, lead })),
  )
}
