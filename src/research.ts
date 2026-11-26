import type { Lead, Scenario, Search } from './fixtures'

export const decisions = {
  approved: 'Approuvé',
  flagged: 'Signalé',
  dismissed: 'Écarté',
} as const

export type Decision = keyof typeof decisions

export type Review = {
  decision: Decision
  reason: string
  reviewedAt: string
}

export type Session = {
  id: string
  search: Search
  scenario: Scenario
  mode?: 'live'
  retried?: boolean
  tasks?: {
    kind: 'search' | 'page'
    input: string
    state: 'queued' | 'complete' | 'failed'
    attempts?: number
    detail?: string
  }[]
  createdAt: string
  leads: Lead[]
  reviews: Record<string, Review | undefined>
  followUps: Record<string, FollowUp | undefined>
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
    session.leads.filter(lead => session.reviews[lead.id]?.decision === 'approved')
      .map(lead => ({ session, lead })),
  )
}
