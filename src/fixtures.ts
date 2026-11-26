export const defaultSearch = {
  product: 'Poisson en conserve du Maroc',
  market: 'France',
  role: 'Importateurs et distributeurs',
}

export type Search = typeof defaultSearch
export type Scenario = 'complete' | 'partial'

export const steps = [
  'Découverte des entreprises',
  'Qualification des prospects',
  'Contrôle des sources',
]

export type Evidence = {
  id?: number
  manual?: boolean
  live?: boolean
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

export function sampleLeads(search: Search): Lead[] {
  const evidence = (field: string, source: string, slug: string, excerpt: string): Evidence => ({
    field,
    source,
    url: `https://${slug}.example/`,
    excerpt,
    observedAt: '2026-11-25',
  })

  return [
    {
      id: 'atlas',
      name: 'Atlas Marée Distribution',
      contact: 'achats@atlas-maree.example',
      status: 'corroborated',
      reason: 'Le site et un annuaire indépendant concordent sur l’activité. Le site publie une adresse achats.',
      evidence: [
        evidence('Produit et activité', 'Site de l’entreprise', 'atlas-maree',
          `Atlas Marée Distribution figure dans la catégorie « ${search.role} » pour le produit « ${search.product} » sur le marché « ${search.market} ».`),
        evidence('Identité et activité', 'Annuaire professionnel', 'annuaire-agro',
          'Atlas Marée Distribution est répertoriée dans le commerce de gros de produits alimentaires importés.'),
        evidence('E-mail achats', 'Page de contact', 'atlas-maree',
          'Pour joindre notre service achats, écrivez à achats@atlas-maree.example.'),
      ],
    },
    {
      id: 'quai',
      name: 'Comptoir du Quai',
      contact: null,
      status: 'missing',
      reason: 'Le catalogue indique une activité pertinente. Cherchez un contact achats public avant toute prise de contact.',
      evidence: [
        evidence('Produit et activité', 'Catalogue professionnel', 'comptoir-quai',
          `Catalogue professionnel pour le marché « ${search.market} » : « ${search.product} ». Catégorie : « ${search.role} ».`),
      ],
    },
    {
      id: 'rivages',
      name: 'Rivages Négoce',
      contact: null,
      status: 'conflict',
      reason: 'Le numéro d’immatriculation est associé à un autre nom. Confirmez l’identité de l’entreprise avant de la retenir.',
      evidence: [
        evidence('Identité déclarée', 'Site de l’entreprise', 'rivages-negoce',
          'Rivages Négoce, immatriculation EX-1842.'),
        evidence('Identité enregistrée', 'Registre des entreprises', 'registre-commerce',
          'Immatriculation EX-1842 : Ateliers du Rivage.'),
      ],
    },
  ]
}
