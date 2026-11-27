export const defaultSearch = {
  product: 'Poisson en conserve du Maroc',
  market: 'France',
  role: 'Importateurs et distributeurs',
}

export type Search = typeof defaultSearch & { origin?: string }
export type Evidence = {
  id?: number
  manual?: boolean
  live?: boolean
  sourceType?: string
  paraphrased?: boolean
  field: string
  source: string
  url: string
  excerpt: string
  observedAt: string
}

export type Qualification = {
  identity: 'pending' | 'verified' | 'unverified' | 'conflict'
  siren?: string
  roleMention: boolean
  marketMention: boolean
  origin?: { requested: string; mentioned: boolean }
}

export type Lead = {
  id: string
  name: string
  contact: string | null
  qualification?: Qualification
  status: 'corroborated' | 'missing' | 'conflict' | 'unverified' | 'documented' | 'identity-verified'
  reason: string
  evidence: Evidence[]
}
