import { defaultSearch, type Search } from './prospects.ts'

export const missions: { id: string; title: string; search: Search }[] = [
  {
    id: 'tomates-france',
    title: 'Vendre des tomates marocaines en France',
    search: { product: 'Tomates', origin: 'Maroc', market: 'France', role: 'Importateurs et distributeurs' },
  },
  {
    id: 'fish-france',
    title: 'Vendre des conserves de poisson en France',
    search: { ...defaultSearch, product: 'Poisson en conserve', origin: 'Maroc' },
  },
  {
    id: 'olive-spain',
    title: 'Trouver des acheteurs d’huile d’olive en Espagne',
    search: { product: 'Huile d’olive', origin: 'Maroc', market: 'Espagne', role: 'Acheteurs' },
  },
]

export function searchQueries(search: Search) {
  const criteria = [search.product, search.market, search.origin && `origine ${search.origin}`].filter(Boolean).join(' ')
  const alternative = search.role === 'Fournisseurs' ? 'fabricant exportateur catalogue'
    : search.role === 'Acheteurs' ? 'approvisionnement acheteur professionnel'
      : 'grossiste importateur catalogue'
  return [
    { label: 'Trouver des entreprises', query: `${criteria} ${search.role}` },
    { label: 'Trouver des catalogues et des contacts professionnels', query: `${criteria} ${alternative}` },
  ]
}
