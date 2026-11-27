export const corridor = {
  id: 'maroc-france-conserves',
  name: 'Maroc → France',
  product: 'Conserves de poisson',
  observedAt: '2026-11-27',
  products: ['Sardines', 'Maquereaux', 'Anchois', 'Thon'] as const,
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

export type ProductReference = {
  product: Product
  description: string
  url: string
}

type Supplier = {
  id: string
  name: string
  role: string
  references: ProductReference[]
  sites: { city: string; detail: string; url: string }[]
  evidence: { label: string; summary: string; url: string }[]
}

export const suppliers: Supplier[] = [
  {
    id: 'lgmc', name: 'LGMC Industries', role: 'Fabricant et exportateur',
    references: [
      { product: 'Sardines', description: 'Entières ou en filets, dont des références sans peau et sans arêtes.', url: 'https://lgmc-mutandis.com/fr/lgmc-nos-offres-produits/' },
      { product: 'Maquereaux', description: 'Entiers ou en filets. Le catalogue présente des recettes au naturel, à l’huile et en sauce.', url: 'https://lgmc-mutandis.com/fr/lgmc-nos-offres-produits/' },
    ],
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
    references: [
      { product: 'Sardines', description: 'Classiques, en filets ou en morceaux. Recettes à l’huile, à la tomate ou au naturel.', url: 'https://mdm-pelagic.com/produits/' },
      { product: 'Maquereaux', description: 'Entier, en morceaux ou en filets, avec plusieurs huiles et sauces au catalogue.', url: 'https://mdm-pelagic.com/produits/' },
      { product: 'Thon', description: 'Filets et miettes, notamment à l’huile végétale ou à la sauce tomate.', url: 'https://mdm-pelagic.com/produits/' },
    ],
    sites: [{ city: 'Tan-Tan', detail: 'Conserverie décrite par MDM Pelagic. Vérifier son agrément pour le lot envisagé.',
      url: 'https://mdm-pelagic.com/mdm-pelagic/' }],
    evidence: [
      { label: 'Gamme et activité · site de l’entreprise', summary: 'MDM Pelagic déclare mettre en conserve des sardines et du maquereau, notamment pour des marques de distributeurs.',
        url: 'https://mdm-pelagic.com/mdm-pelagic/' },
      { label: 'Conditionnements · fiche du fabricant', summary: 'La fiche liste des boîtes Club de 90 et 125 g et des bocaux de 190 et 250 g. Demandez les formats disponibles pour la recette choisie.',
        url: 'https://mdm-pelagic.com/conserverie-formats/' },
      { label: 'Présence au SIAL 2026 · annuaire de l’organisateur', summary: 'L’organisateur répertorie MDM Pelagic au pavillon Morocco Foodex en octobre 2026.',
        url: 'https://www.sialparis.com/fr-FR/EXHIBITORS-2024/Exposant/MDM-PELAGIC-Merveilles-Des-Mers' },
    ],
  },
  {
    id: 'unimer', name: 'Unimer Group', role: 'Groupe exportateur',
    references: [
      { product: 'Sardines', description: 'Conserves de sardines proposées à l’export selon le site du groupe.', url: 'https://unimergroup.com/' },
      { product: 'Anchois', description: 'Conserves d’anchois proposées à l’export. Demandez la fiche technique et le conditionnement.', url: 'https://unimergroup.com/' },
    ], sites: [],
    evidence: [{
      label: 'Gamme export · site du groupe', summary: 'Unimer présente une activité d’exportation de conserves de sardines et d’anchois. L’unité et la spécification restent à confirmer pour un produit donné.',
      url: 'https://unimergroup.com/',
    }],
  },
  {
    id: 'conserval', name: 'Conserval', role: 'Fabricant de conserves',
    references: [
      { product: 'Sardines', description: 'Filets de sardines conditionnés en conserve. La conserverie propose des étiquettes personnalisées sur demande.', url: 'https://conserval.ma/demander-un-devis/' },
      { product: 'Maquereaux', description: 'Maquereaux préparés en filets et mis en boîte. Demandez les recettes et grammages disponibles.', url: 'https://conserval.ma/demander-un-devis/' },
    ],
    sites: [{ city: 'Safi', detail: 'Conserverie déclarée par Conserval. Vérifiez l’agrément de l’unité pour votre produit.', url: 'https://conserval.ma/demander-un-devis/' }],
    evidence: [{ label: 'Production et devis · site de l’entreprise', summary: 'Conserval présente son offre de sardines et de maquereaux en conserve et indique une adresse à Safi.', url: 'https://conserval.ma/demander-un-devis/' }],
  },
]

export const buyerReferences: Record<string, ProductReference[]> = {
  'siren-452565823': [
    { product: 'Sardines', description: 'Conserves en plusieurs recettes, notamment à l’huile, à la tomate et au piment.', url: 'https://moulin-ville.fr/poisson' },
    { product: 'Maquereaux', description: 'Filets à l’huile d’olive en bocal de 190 g, marque Conservera de Tarifa importée d’Espagne.', url: 'https://moulin-ville.fr/grossiste-alimentaire/conservera-de-tarifa' },
    { product: 'Anchois', description: 'Conserves et filets d’anchois dans la gamme de produits de la mer.', url: 'https://moulin-ville.fr/poisson' },
    { product: 'Thon', description: 'Thon entier, filets et ventrèche dans le catalogue du grossiste.', url: 'https://moulin-ville.fr/poisson' },
  ],
  'siren-636680415': [
    { product: 'Sardines', description: 'Sardines en conserve présentées dans la gamme de produits de la mer.', url: 'https://vital.fr/' },
    { product: 'Thon', description: 'Thon listao et albacore. Le site montre des références en pochon, en boîte et en filets.', url: 'https://vital.fr/' },
  ],
  'siren-978450146': [
    { product: 'Sardines', description: 'Petites sardines EL MENU, dont des recettes au citron et au piment en boîte de 90 g.', url: 'https://epicerie.yulyfood.com/collections/sardines-et-divers-mer' },
    { product: 'Maquereaux', description: 'Filets de maquereaux DANI en boîte de 125 g, dont une recette à l’escabèche.', url: 'https://epicerie.yulyfood.com/collections/sardines-et-divers-mer' },
    { product: 'Anchois', description: 'Filets d’anchois, dont des références en boîte de 74 g et en bocal de 100 g.', url: 'https://epicerie.yulyfood.com/collections/nos-conserves-danchois' },
    { product: 'Thon', description: 'Collection de conserves de thon destinée aux professionnels.', url: 'https://epicerie.yulyfood.com/collections/nos-conserves-de-thon' },
  ],
}

export function referencesFor(buyerId: string, filter: Product | '') {
  return (buyerReferences[buyerId] ?? []).filter(reference => !filter || reference.product === filter)
}

export function sharedProducts(supplier: Supplier, buyerId: string, filter: Product | '') {
  const products = new Set(referencesFor(buyerId, filter).map(reference => reference.product))
  return supplier.references.map(reference => reference.product).filter(product => products.has(product))
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
