export const defaultSearch = {
  product: 'Poisson en conserve du Maroc',
  market: 'France',
  role: 'Importateurs et distributeurs',
}

export type Search = typeof defaultSearch
export type Evidence = {
  id?: number
  manual?: boolean
  live?: boolean
  sourceType?: string
  field: string
  source: string
  url: string
  excerpt: string
  observedAt: string
}

export type Lead = {
  id: string
  name: string
  contact: string | null
  status: 'corroborated' | 'missing' | 'conflict' | 'unverified'
  reason: string
  evidence: Evidence[]
}
