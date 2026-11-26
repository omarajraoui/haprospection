import type { Search } from './prospects'
import type { Decision, EvidenceInput, FollowUp, Session, Source } from './research'

async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json()
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('ha-session-ended'))
    }
    throw new Error(data.error ?? 'La requête a échoué.')
  }
  return data as T
}

export const loadSessions = () => request<Session[]>('/api/sessions')

export const createSession = (search: Search) =>
  request<Session>('/api/sessions', 'POST', { ...search, mode: 'live' })

export const saveReview = (sessionId: string, leadId: string, decision: Decision, reason: string) =>
  request<Session>(`/api/sessions/${sessionId}/leads/${leadId}/review`, 'PUT', { decision, reason })

export const loadSources = () => request<Source[]>('/api/sources')

export const createSource = (source: Pick<Source, 'name' | 'url' | 'type'>) =>
  request<Source>('/api/sources', 'POST', source)

export const attachEvidence = (sessionId: string, leadId: string, evidence: EvidenceInput) =>
  request<Session>(`/api/sessions/${sessionId}/leads/${leadId}/evidence`, 'PUT', evidence)

export const saveFollowUp = (sessionId: string, leadId: string, followUp: FollowUp) =>
  request<Session>(`/api/sessions/${sessionId}/leads/${leadId}/follow-up`, 'PUT', followUp)

export const discoveryConfig = () => request<{ enabled: boolean; version: string; logPath: string }>('/api/discovery')
export const retryDiscovery = (id: string) => request<Session>(`/api/sessions/${id}/retry`, 'POST', {})

export type AccessStatus = { hosted: boolean; authenticated: boolean; configured?: boolean }
export const accessStatus = () => request<AccessStatus>('/api/auth/status')
export const signIn = (email: string, password: string) =>
  request<{ authenticated: boolean }>('/api/auth/login', 'POST', { email, password })
export const signOut = () => request<{ authenticated: boolean }>('/api/auth/logout', 'POST', {})
