export const sourceKinds = {
  registry: { label: 'Registre public', use: 'Vérifier la dénomination et l’immatriculation.' },
  company: { label: 'Site ou catalogue d’entreprise', use: 'Vérifier ce que l’entreprise déclare sur ses produits ou son activité.' },
  directory: { label: 'Annuaire ou plateforme', use: 'Découvrir des pistes à recouper.' },
  unknown: { label: 'Source à qualifier', use: 'Identifier qui publie la page et ce qu’elle permet de vérifier.' },
}

const registries = ['annuaire-entreprises.data.gouv.fr', 'inpi.fr', 'bodacc.fr']
const directories = ['kompass.com', 'europages.com', 'europages.fr', 'espaceagro.com', 'alibaba.com', 'linkedin.com']

export const recommendedResources = [
  {
    name: 'Annuaire des entreprises',
    url: 'https://annuaire-entreprises.data.gouv.fr/',
    type: 'Registre',
    market: 'France',
    description: 'Recherchez le prospect par sa raison sociale ou son SIREN. Pour la fiche, utilisez le lien vers le résultat de l’entreprise.',
  },
  {
    name: 'Moulin-Ville · Catalogue poisson',
    url: 'https://moulin-ville.fr/poisson',
    type: 'Site d’entreprise',
    market: 'France · Poisson en conserve',
    description: 'Exemple de catalogue publié par l’entreprise. La page décrit ses gammes et son activité d’importation.',
  },
]

export function sourceKind(url: string, type?: string): keyof typeof sourceKinds {
  let host = ''
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return 'unknown'
  }
  const onDomain = (domain: string) => host === domain || host.endsWith('.' + domain)
  if (registries.some(onDomain)) return 'registry'
  if (directories.some(onDomain) || type === 'Annuaire') return 'directory'
  if (onDomain('moulin-ville.fr') || type === 'Site d’entreprise') return 'company'
  return 'unknown'
}
