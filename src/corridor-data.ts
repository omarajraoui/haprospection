export const corridor = {
  id: 'maroc-france-conserves',
  name: 'Maroc → France',
  product: 'Conserves de poisson',
  observedAt: '2026-11-27',
  products: ['Sardines', 'Maquereaux', 'Anchois'] as const,
}

export type Product = (typeof corridor.products)[number]

export type Resource = {
  name: string
  url: string
  category: string
  purpose: string
}

export const corridorResources: Resource[] = [
  { name: 'OMPIC · DirectInfo', url: 'https://www.ompic.ma/fr/services-rcc', category: 'Identité · Maroc',
    purpose: 'Consulter le registre et demander les pièces de l’entreprise.' },
  { name: 'ONSSA', url: 'https://www.onssa.gov.ma/controle-des-produits-alimentaires/produits-de-la-peche-et-de-laquaculture-1/', category: 'Établissements · Maroc',
    purpose: 'Vérifier l’unité et le périmètre de son agrément dans la liste correspondant au produit.' },
  { name: 'Morocco Foodex', url: 'https://www.moroccofoodex.org.ma/fr/agreage-technique-des-exportateurs-unites/', category: 'Export · Maroc',
    purpose: 'Consulter les démarches relatives à l’agréage technique des exportateurs et des unités.' },
  { name: 'PortNet', url: 'https://www.portnet.ma/portnet-commerce-exterieur', category: 'Formalités · Maroc',
    purpose: 'Préparer les formalités d’import-export et trouver le service correspondant à l’opération.' },
  { name: 'Office des Changes', url: 'https://www.oc.gov.ma/fr/e-services/base-de-donnees-du-commerce-exterieur', category: 'Marché · Maroc',
    purpose: 'Consulter les statistiques marocaines du commerce extérieur par produit et pays.' },
  { name: 'Annuaire des entreprises', url: 'https://annuaire-entreprises.data.gouv.fr/', category: 'Identité · France',
    purpose: 'Contrôler la dénomination et l’immatriculation d’un acheteur français.' },
  { name: 'Eurostat Comext', url: 'https://ec.europa.eu/eurostat/web/international-trade-in-goods/database', category: 'Marché · UE',
    purpose: 'Comparer les quantités et valeurs agrégées du commerce par code produit et partenaire.' },
  { name: 'Access2Markets', url: 'https://trade.ec.europa.eu/access-to-markets/en/my-trade-assistant', category: 'Accès au marché · UE',
    purpose: 'Vérifier les droits, règles d’origine et formalités pour le produit et le trajet envisagés.' },
]

type Supplier = {
  id: string
  name: string
  role: string
  products: readonly Product[]
  sites: { city: string; detail: string; url: string }[]
  evidence: { label: string; summary: string; url: string }[]
}

export const suppliers: Supplier[] = [
  {
    id: 'lgmc', name: 'LGMC Industries', role: 'Fabricant et exportateur',
    products: ['Sardines', 'Maquereaux'],
    sites: ['Safi', 'Agadir'].map(city => ({
      city, detail: 'Ville de conserverie déclarée par LGMC. Identifier l’unité exacte et vérifier son agrément.',
      url: 'https://lgmc-mutandis.com/fr/lgmc-notre-expertise-conserverie/',
    })),
    evidence: [{
      label: 'Gamme et activité · site de l’entreprise',
      summary: 'LGMC déclare produire et commercialiser des conserves de sardines et de maquereaux sous ses marques et celles de distributeurs.',
      url: 'https://lgmc-mutandis.com/fr/lgmc-le-meilleur-de-la-mer/',
    }],
  },
  {
    id: 'mdm', name: 'MDM Pelagic', role: 'Fabricant de conserves',
    products: ['Sardines', 'Maquereaux'],
    sites: [{ city: 'Tan-Tan', detail: 'Conserverie décrite par MDM Pelagic. Vérifier son agrément pour le lot envisagé.',
      url: 'https://mdm-pelagic.com/mdm-pelagic/' }],
    evidence: [
      { label: 'Gamme et activité · site de l’entreprise', summary: 'MDM Pelagic déclare mettre en conserve des sardines et du maquereau, notamment pour des marques de distributeurs.',
        url: 'https://mdm-pelagic.com/mdm-pelagic/' },
      { label: 'Présence au SIAL 2026 · annuaire de l’organisateur', summary: 'L’organisateur répertorie MDM Pelagic au pavillon Morocco Foodex en octobre 2026.',
        url: 'https://www.sialparis.com/fr-FR/EXHIBITORS-2024/Exposant/MDM-PELAGIC-Merveilles-Des-Mers' },
    ],
  },
  {
    id: 'unimer', name: 'Unimer Group', role: 'Groupe exportateur',
    products: ['Sardines', 'Anchois'], sites: [],
    evidence: [{
      label: 'Gamme export · site du groupe', summary: 'Unimer présente une activité d’exportation de conserves de sardines et d’anchois. L’unité et la spécification restent à confirmer pour un produit donné.',
      url: 'https://unimergroup.com/',
    }],
  },
]

export const buyerProducts: Record<string, readonly Product[]> = {
  'siren-452565823': ['Sardines', 'Maquereaux', 'Anchois'],
  'siren-636680415': ['Sardines'],
}

export function sharedProducts(supplier: Supplier, buyerId: string, filter: Product | '') {
  return supplier.products.filter(product => (!filter || filter === product) && buyerProducts[buyerId]?.includes(product))
}

export type Opportunity = {
  id: string
  title: string
  buyer: string | null
  deadline: string
  published: string | null
  codes: string[]
  lotTitles: string[]
  url: string
}

export type OpportunityFeed = { checkedAt: string; opportunities: Opportunity[] }
