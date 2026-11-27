import { normalized } from './discovery.ts'
import type { Lead } from '../src/prospects.ts'

export type RegistryEntry = { siren: string; name: string; active: boolean }

export async function lookupFrenchCompany(siren: string): Promise<RegistryEntry | null> {
  if (!/^\d{9}$/.test(siren)) throw new Error('Identifiant SIREN invalide.')
  const url = new URL('https://recherche-entreprises.api.gouv.fr/search')
  url.search = new URLSearchParams({ q: siren, minimal: 'true', per_page: '1' }).toString()
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'HA-Prospection (contrôle de société)' },
    signal: AbortSignal.timeout(8000),
    redirect: 'error',
  })
  if (!response.ok) throw new Error(`Registre français · HTTP ${response.status}`)
  const data = await response.json() as { results?: { siren?: string; nom_complet?: string; etat_administratif?: string }[] }
  if (!Array.isArray(data.results)) throw new Error('Réponse du registre invalide.')
  const entry = data.results.find(item => item.siren === siren)
  if (!entry) return null
  if (typeof entry.nom_complet !== 'string' || !entry.nom_complet.trim() || !['A', 'C'].includes(entry.etat_administratif ?? '')) {
    throw new Error('État de l’entreprise absent du registre.')
  }
  return { siren, name: entry.nom_complet, active: entry.etat_administratif === 'A' }
}

function legalName(value: string) {
  return normalized(value).split(' ').filter(word => !['sas', 'sasu', 'sarl', 'sa', 'eurl', 'societe'].includes(word)).join(' ')
}

export function applyRegistryCheck(lead: Lead, entry: RegistryEntry | null) {
  const checks = lead.qualification
  if (!checks) return
  if (!entry) {
    checks.identity = 'unverified'
    lead.reason = 'Le numéro publié sur le site n’a pas été retrouvé dans le registre consulté. Vérifiez l’identité de l’entreprise.'
    return
  }

  const matches = legalName(lead.name) !== '' && legalName(lead.name) === legalName(entry.name)
  checks.identity = !entry.active ? 'conflict' : matches ? 'verified' : 'unverified'
  lead.status = !entry.active ? 'conflict' : matches ? 'identity-verified' : 'unverified'
  lead.reason = !entry.active
    ? 'Le registre indique une unité légale inactive. Vérifiez le numéro et l’entité avant de poursuivre.'
    : matches
      ? 'Le numéro et le nom du site concordent avec le registre. Confirmez encore le rôle, le marché et le bon interlocuteur.'
      : 'Le registre retrouve le numéro publié, mais le nom diffère. Vérifiez le lien entre la marque du site et l’entité légale.'
  lead.evidence.push({
    field: 'Identité déclarée au registre',
    source: 'API Recherche d’entreprises · Annuaire des entreprises',
    url: `https://annuaire-entreprises.data.gouv.fr/entreprise/${entry.siren}`,
    excerpt: `${entry.name} · SIREN ${entry.siren} · ${entry.active ? 'unité légale active' : 'unité légale inactive'}.`,
    observedAt: new Date().toISOString().slice(0, 10),
    live: true, paraphrased: true,
  })
}
