import type { Lead } from './prospects'
import type { Decision, Review } from './research'

export type ReviewFilter = 'all' | 'pending' | Decision
export type EvidenceFilter = 'all' | Lead['status']

export function searchable(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim()
}

export function matchesLead(lead: Lead, review: Review | undefined, query: string,
  reviewFilter: ReviewFilter, evidenceFilter: EvidenceFilter) {
  return (reviewFilter === 'all' || reviewFilter === (review?.decision ?? 'pending'))
    && (evidenceFilter === 'all' || evidenceFilter === lead.status)
    && searchable(`${lead.name} ${lead.contact ?? ''} ${lead.evidence.map(item => item.source).join(' ')}`)
      .includes(searchable(query))
}
