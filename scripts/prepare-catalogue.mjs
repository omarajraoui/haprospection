import { writeFile } from 'node:fs/promises'

const companies = [
  {
    siren: '452565823',
    legalName: 'MOULIN VILLE FRANCE',
    url: 'https://moulin-ville.fr/poisson',
    description: 'L’entreprise présente une gamme de conserves de poisson pour les professionnels et décrit son activité de grossiste importateur.',
  },
  {
    siren: '636680415',
    legalName: 'VITAL',
    url: 'https://vital.fr/',
    description: 'Le site présente VITAL comme grossiste importateur de conserves alimentaires en France et cite le thon et les sardines dans sa gamme.',
  },
  {
    siren: '978450146',
    legalName: 'YULY FOOD',
    url: 'https://epicerie.yulyfood.com/collections/sardines-et-divers-mer',
    description: 'Le grossiste présente aux professionnels des conserves de la mer, dont des sardines et des filets de maquereaux en boîte de 125 g.',
  },
]

const observedAt = process.argv[2]
if (!observedAt || !/^\d{4}-\d{2}-\d{2}$/.test(observedAt)
  || !Number.isFinite(Date.parse(observedAt)) || new Date(observedAt).toISOString().slice(0, 10) !== observedAt) {
  throw new Error('Provide the date on which you reviewed the linked company pages, as YYYY-MM-DD.')
}

const leads = []
for (const company of companies) {
  const api = new URL('https://recherche-entreprises.api.gouv.fr/search')
  api.search = new URLSearchParams({ q: company.siren, minimal: 'true', per_page: '1' }).toString()
  const response = await fetch(api, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: 'application/json', 'User-Agent': 'HA-Prospection/1.0 (catalogue preparation)' },
  })
  if (!response.ok) throw new Error(`Registry lookup failed for ${company.siren}: HTTP ${response.status}`)
  const { results } = await response.json()
  const entry = results?.find(item => item.siren === company.siren)
  if (entry?.nom_complet !== company.legalName || entry.etat_administratif !== 'A') {
    throw new Error(`Legal identity or current status requires review for ${company.legalName}.`)
  }
  leads.push({
    id: `siren-${company.siren}`,
    name: entry.nom_complet,
    contact: null,
    status: 'documented',
    reason: 'Identité contrôlée dans le registre français et gamme documentée par l’entreprise. Confirmez le contact achats et l’intérêt pour votre offre.',
    evidence: [
      {
        field: 'Dénomination et immatriculation',
        source: 'API Recherche d’entreprises · Annuaire des entreprises',
        url: `https://annuaire-entreprises.data.gouv.fr/entreprise/${company.siren}`,
        excerpt: `${entry.nom_complet} · SIREN ${entry.siren} · unité légale active au moment de la consultation.`,
        observedAt: new Date().toISOString().slice(0, 10),
        live: true,
        paraphrased: true,
      },
      {
        field: 'Gamme et activité déclarée',
        source: company.legalName,
        url: company.url,
        excerpt: company.description,
        observedAt,
        live: true,
        sourceType: 'Site d’entreprise',
        paraphrased: true,
      },
    ],
  })
}
await writeFile(new URL('../server/prepared-catalogue.json', import.meta.url), JSON.stringify({
  mode: 'prepared',
  search: { product: 'Poisson en conserve', market: 'France', role: 'Importateurs et distributeurs' },
  createdAt: new Date().toISOString(),
  tasks: [],
  leads,
}, null, 2) + '\n')
console.log(`Prepared catalogue written with ${leads.length} registry-checked companies.`)
