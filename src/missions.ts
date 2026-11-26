import { defaultSearch, type Search } from './prospects'

export const missions: { id: string; title: string; search: Search }[] = [
  {
    id: 'fish-france',
    title: 'Trouver des importateurs de poisson en conserve',
    search: defaultSearch,
  },
  {
    id: 'rice-senegal',
    title: 'Trouver des fournisseurs de riz blanc',
    search: { product: 'Riz blanc', market: 'Sénégal', role: 'Fournisseurs' },
  },
  {
    id: 'olive-spain',
    title: 'Trouver des acheteurs d’huile d’olive',
    search: { product: 'Huile d’olive', market: 'Espagne', role: 'Acheteurs' },
  },
]
