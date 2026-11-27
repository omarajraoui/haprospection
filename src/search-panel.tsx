import { useState } from 'react'
import { missions, searchQueries } from './missions'
import type { Search } from './prospects'
import { inputClass } from './resources'

export function SearchPanel({ seed, live, loading, busy, onLaunch }: {
  seed?: { product: string; market: string }
  live: boolean
  loading: boolean
  busy: boolean
  onLaunch: (search: Search) => Promise<void>
}) {
  const [draft, setDraft] = useState<Search>({ product: seed?.product ?? '', origin: '', market: seed?.market ?? '', role: 'Importateurs et distributeurs' })
  const [guide, setGuide] = useState<Search>()
  const [chosen, setChosen] = useState('')
  const criteria = { ...draft, product: draft.product.trim(), market: draft.market.trim(), origin: draft.origin?.trim() }

  function change(field: keyof Search, value: string) {
    setDraft(current => ({ ...current, [field]: value }))
    setGuide(undefined)
    setChosen('')
  }

  return (
    <section id="web-search-options" aria-labelledby="search-heading" className="surface p-5 sm:p-6">
      <h2 id="search-heading" tabIndex={-1} className="text-xl font-semibold">Chercher des entreprises</h2>
      <p className="mt-2 text-sm text-slate-700">
        {loading ? 'Vérification du mode de recherche…' : live
          ? 'La recherche automatique consulte des pages web et affiche les extraits qui justifient chaque piste.'
          : 'En mode public, préparez vos requêtes puis ouvrez les résultats dans Google.'}
      </p>
      <p className="mt-4 text-sm font-semibold">Exemples à personnaliser</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Exemples de missions">
        {missions.map(mission => (
          <button key={mission.id} type="button" className="filter-pill" aria-pressed={chosen === mission.id}
            onClick={() => { setDraft(mission.search); setGuide(undefined); setChosen(mission.id) }}>
            {mission.title}
          </button>
        ))}
      </div>
      <form className="mt-5 border-t border-stone-200 pt-4" onSubmit={event => {
        event.preventDefault()
        if (!criteria.product || !criteria.market) return
        if (live) void onLaunch(criteria)
        else setGuide(criteria)
      }}>
        <fieldset disabled={loading || busy} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Produit
            <input className={inputClass} required maxLength={100} placeholder="Ex. tomates fraîches"
              value={draft.product} onChange={event => change('product', event.target.value)} />
          </label>
          <label className="text-sm font-semibold">Pays d’origine · facultatif
            <input className={inputClass} maxLength={100} placeholder="Ex. Maroc"
              value={draft.origin ?? ''} onChange={event => change('origin', event.target.value)} />
          </label>
          <label className="text-sm font-semibold">Pays où chercher l’entreprise
            <input className={inputClass} required maxLength={100} placeholder="Ex. France"
              value={draft.market} onChange={event => change('market', event.target.value)} />
          </label>
          <label className="text-sm font-semibold">Type d’entreprise
            <select className={inputClass} value={draft.role} onChange={event => change('role', event.target.value)}>
              <option>Importateurs et distributeurs</option><option>Acheteurs</option><option>Fournisseurs</option>
            </select>
          </label>
          <p className="text-sm text-slate-600 sm:col-span-2">
            Pour vendre votre produit, cherchez des importateurs, des distributeurs ou des acheteurs. Pour acheter, choisissez Fournisseurs.
          </p>
          <div className="sm:col-span-2">
            <button type="submit" disabled={!criteria.product || !criteria.market} className="primary-button">
              {busy ? 'Recherche en cours…' : live ? 'Lancer la recherche automatique' : 'Préparer ma recherche guidée'}
            </button>
          </div>
        </fieldset>
      </form>
      <details className="mt-4 text-sm text-slate-700">
        <summary className="cursor-pointer font-semibold">Comment les résultats sont-ils vérifiés ?</summary>
        <p className="mt-2">En recherche automatique, le moteur trouve des pages publiques. L’application extrait les mentions du produit, relève les indices sur le rôle, le pays et l’origine, et peut vérifier l’identité d’une société française quand un SIREN est publié.</p>
        <p className="mt-2">Une fiche indique les éléments trouvés et ceux qui restent à confirmer. Un catalogue ou un SIREN ne confirme pas qu’une entreprise souhaite acheter votre produit.</p>
      </details>
      {guide && (
        <section className="mt-5 rounded-xl border border-stone-200 bg-paper p-4" aria-labelledby="guided-results">
          <h3 id="guided-results" className="font-semibold">Requêtes à ouvrir</h3>
          <p role="status" className="mt-1 text-sm text-slate-700">
            {guide.product} · {guide.origin && `Origine ${guide.origin} · `}{guide.market} · {guide.role}
          </p>
          <ul className="mt-3 space-y-3">
            {searchQueries(guide).map(({ label, query }) => (
              <li key={label}>
                <a className="font-semibold text-forest underline" target="_blank" rel="noreferrer"
                  href={`https://www.google.com/search?${new URLSearchParams({ q: query })}`}>{label} sur Google</a>
                <p className="text-sm text-slate-600">{query}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate-700">Ouvrez le site de l’entreprise, vérifiez son rôle et sa gamme, puis enregistrez le lien dans Ressources.</p>
        </section>
      )}
    </section>
  )
}
