import { useEffect, useState } from 'react'
import { corridor, corridorResources, referencesFor, sharedProducts, suppliers, type OpportunityFeed, type Product, type ProductReference } from './corridor-data'
import { searchable } from './lead-filters'
import type { Lead } from './prospects'
import { inputClass } from './resources'

const views = ['Offre marocaine', 'Acheteurs en France', 'Opportunités', 'Organismes et marché'] as const
type View = (typeof views)[number]
const storageKey = `ha-follow-${corridor.id}`
const seenKey = `${storageKey}-opportunities`

const frenchDay = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' })
const frenchTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' })
const showDay = (day: string) => frenchDay.format(new Date(`${day}T12:00:00Z`))

function readLocal(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}

function writeLocal(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* A browsing session can continue without saved preferences. */ }
}

export function OpportunityView({ followed = false, international = false }: { followed?: boolean; international?: boolean }) {
  const [feed, setFeed] = useState<OpportunityFeed>()
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [newIds, setNewIds] = useState<string[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch(international ? '/api/market/opportunities' : '/api/corridors/maroc-france-conserves/opportunities', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('TED unavailable')
        return await response.json() as OpportunityFeed
      }).then(data => {
        if (controller.signal.aborted) return
        if (followed) {
          const ids = data.opportunities.map(item => item.id)
          const earlier = readLocal(seenKey)
          const seen = new Set(earlier?.split(',') ?? [])
          setNewIds(earlier === null ? [] : ids.filter(id => !seen.has(id)))
          writeLocal(seenKey, ids.join(','))
        }
        setFeed(data)
      }).catch(() => {
        if (!controller.signal.aborted) setError(true)
      })
    return () => controller.abort()
  }, [attempt, followed, international])

  const countries = [...new Set(feed?.opportunities.flatMap(item => item.country ? [item.country] : []))].sort()
  const visible = feed?.opportunities.filter(item => (!country || item.country === country)
    && searchable([item.title, item.buyer, ...item.lotTitles, ...item.codes].join(' ')).includes(searchable(query.trim()))) ?? []

  return (
    <section aria-labelledby="opportunity-heading" className="surface p-5 sm:p-7">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 id="opportunity-heading" className="text-xl font-semibold">Demandes d’achat publiques</h2>
          <p className="mt-2 text-sm text-slate-600">
            {international ? 'Avis publics TED pour les denrées alimentaires et les produits agricoles, avec une échéance future identifiable.'
              : 'Avis TED publiés par des acheteurs français, pour les catégories de poisson sélectionnées et avec une échéance future identifiable.'}
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={() => {
          setFeed(undefined)
          setError(false)
          setCountry('')
          setAttempt(value => value + 1)
        }}>Actualiser les avis</button>
      </div>
      {international && !!feed?.opportunities.length && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">Produit, acheteur ou code CPV
            <input type="search" className={inputClass} value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">Pays de l’acheteur
            <select className={inputClass} value={country} onChange={event => setCountry(event.target.value)}>
              <option value="">Tous les pays de cette sélection</option>
              {countries.map(code => <option key={code}>{code}</option>)}
            </select>
          </label>
        </div>
      )}
      {error ? <p role="status" className="mt-5 rounded-lg bg-amber-50 p-4 text-amber-900">TED est momentanément indisponible. Réessayez ou consultez le portail officiel.</p>
        : !feed ? <p role="status" className="mt-5">Consultation des avis TED…</p>
          : feed.opportunities.length === 0 ? <p role="status" className="mt-5 rounded-lg bg-paper p-4">Aucun avis avec une échéance future exploitable dans la sélection consultée.</p>
            : visible.length === 0 ? <p role="status" className="mt-5">Aucun avis ne correspond aux filtres.</p>
              : <ul className="mt-4 divide-y divide-stone-200">
              {visible.map(item => (
                <li key={item.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <a className="font-semibold text-forest underline" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                    <span className="mode-label">{newIds.includes(item.id) ? 'Nouveau · ' : ''}Échéance le {showDay(item.deadline)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{item.buyer ?? 'Acheteur à consulter dans l’avis'}{international && item.country && ` · ${item.country}`} · TED {item.id}</p>
                  <p className="mt-1 text-sm text-slate-600">CPV {item.codes.join(', ')}{item.published && ` · Publié le ${showDay(item.published)}`}</p>
                  {item.lotTitles.length > 0 && <p className="mt-2 text-sm text-slate-700">Lots repérés · {item.lotTitles.join(' · ')}</p>}
                  <p className="mt-1 text-sm text-slate-600">Spécifications et volume à confirmer dans l’avis.</p>
                </li>
              ))}
            </ul>}
      {feed && <p className="mt-4 text-sm text-slate-600">Consultation du {frenchTime.format(new Date(feed.checkedAt))}. Vérifiez le lot, l’heure et les conditions de participation dans l’avis.</p>}
      <a className="mt-4 inline-block font-semibold text-forest underline" href="https://ted.europa.eu/fr/" target="_blank" rel="noreferrer">Ouvrir TED</a>
    </section>
  )
}

function PublishedReferences({ references }: { references: ProductReference[] }) {
  return (
    <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200 px-3">
      {references.map(reference => (
        <li key={reference.product} className="py-3">
          <p className="font-semibold">{reference.product}</p>
          <p className="mt-1 text-sm text-slate-700">{reference.description}</p>
          <a className="mt-1 inline-block text-sm font-semibold text-forest underline"
            href={reference.url} target="_blank" rel="noreferrer">Voir la source</a>
        </li>
      ))}
    </ul>
  )
}

export function CorridorView({ buyers, onBuyer, onMarket }: { buyers: Lead[]; onBuyer: (id: string) => void; onMarket: () => void }) {
  const [view, setView] = useState<View>(views[0])
  const [product, setProduct] = useState<Product | ''>('')
  const [city, setCity] = useState('')
  const [buyerQuery, setBuyerQuery] = useState('')
  const [supplierId, setSupplierId] = useState('lgmc')
  const [followed, setFollowed] = useState(() => readLocal(storageKey) === 'true')
  const cities = [...new Set(suppliers.flatMap(supplier => supplier.sites.map(site => site.city)))]
  const visibleSuppliers = suppliers.filter(supplier => (!product || supplier.references.some(reference => reference.product === product))
    && (!city || supplier.sites.some(site => site.city === city)))
  const selected = visibleSuppliers.find(supplier => supplier.id === supplierId) ?? visibleSuppliers[0]
  const visibleBuyers = buyers.filter(buyer => referencesFor(buyer.id, product).length > 0
    && searchable(buyer.name).includes(searchable(buyerQuery)))
  const matches = selected ? buyers.flatMap(buyer => {
    const common = sharedProducts(selected, buyer.id, product)
    return common.length ? [{ buyer, common }] : []
  }) : []

  return (
    <div className="space-y-5">
      <section className="corridor-hero" aria-labelledby="corridor-heading">
        <div>
          <p className="text-sm font-medium text-emerald-100">{corridor.product}</p>
          <h2 id="corridor-heading" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{corridor.name}</h2>
          <p className="mt-3 max-w-xl text-emerald-50/85">Choisissez une offre marocaine et examinez les acheteurs qui commercialisent les mêmes produits.</p>
        </div>
        <button className="rounded-lg border border-emerald-100/50 px-4 py-2.5 font-semibold text-white hover:bg-white/10"
          type="button" aria-pressed={followed} onClick={() => {
            setFollowed(!followed)
            writeLocal(storageKey, String(!followed))
          }}>
          {followed ? 'Corridor suivi' : 'Suivre le corridor'}
        </button>
        {followed && <p className="text-sm text-emerald-100/85 sm:col-span-2">Le suivi et les nouveaux avis sont repérés dans ce navigateur.</p>}
      </section>
      <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-slate-700">Cette vue couvre les conserves de poisson du corridor Maroc → France.</p>
        <button type="button" className="secondary-button" onClick={onMarket}>Voir le catalogue international</button>
      </div>
      <nav aria-label="Vues du corridor" className="flex flex-wrap gap-2">
        {views.map(tab => <button key={tab} type="button" onClick={() => setView(tab)}
          aria-pressed={view === tab} className="filter-pill">{tab}</button>)}
      </nav>

      {(view === 'Offre marocaine' || view === 'Acheteurs en France') && (
        <section className="surface p-4 sm:p-5" aria-labelledby="product-filter-heading">
          <h2 id="product-filter-heading" className="font-semibold">Filtrer les conserves de poisson</h2>
          <p className="mt-1 text-sm text-slate-700">{view === 'Acheteurs en France'
            ? 'Choisissez par exemple Maquereaux pour afficher les entreprises qui en proposent dans leur catalogue.'
            : 'Choisissez un produit pour afficher les fabricants et les recettes qu’ils publient.'}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrer par produit">
            {(['', ...corridor.products] as const).map(item => {
              const count = view === 'Acheteurs en France'
                ? buyers.filter(buyer => referencesFor(buyer.id, item).length > 0).length
                : suppliers.filter(supplier => !item || supplier.references.some(reference => reference.product === item)).length
              return <button key={item} type="button" className="filter-pill" aria-pressed={product === item}
                onClick={() => setProduct(item)}>{item || 'Toutes les conserves'} <span className="ml-1 rounded-full bg-stone-100 px-2 text-slate-700">{count}</span></button>
            })}
          </div>
          {view === 'Offre marocaine' ? <label className="mt-4 block max-w-sm text-sm font-semibold">Ville de production · facultatif
            <select className={inputClass} value={city} onChange={event => setCity(event.target.value)}>
              <option value="">Toutes les villes</option>
              {cities.map(item => <option key={item}>{item}</option>)}
            </select>
          </label> : (
            <details className="mt-4 max-w-sm" open={buyerQuery ? true : undefined}>
              <summary className="cursor-pointer text-sm font-semibold text-forest">Vous connaissez déjà une entreprise ?</summary>
              <label className="mt-2 block text-sm font-semibold">Filtrer par nom · facultatif
                <input className={inputClass} type="search" value={buyerQuery} placeholder="Par exemple Moulin Ville"
                  onChange={event => setBuyerQuery(event.target.value)} />
              </label>
            </details>
          )}
          <p role="status" className="mt-4 text-sm text-slate-600">
            {view === 'Acheteurs en France'
              ? `${visibleBuyers.length} entreprise(s) dans la sélection`
              : `${visibleSuppliers.length} fournisseur(s) dans la sélection`}
            {product && ` · ${product}`}
          </p>
        </section>
      )}

      {view === 'Offre marocaine' && (!selected ? (
        <p className="surface p-5">Aucune offre dans la sélection pour ces filtres.</p>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(200px,0.8fr)_minmax(0,1.6fr)]">
          <ul className="space-y-2" aria-label="Fournisseurs marocains">
            {visibleSuppliers.map(supplier => <li key={supplier.id}>
              <button type="button" className="lead-row" aria-pressed={selected.id === supplier.id}
                onClick={() => setSupplierId(supplier.id)}>
                <span className="block font-semibold">{supplier.name}</span>
                <span className="mt-1 block text-sm text-slate-700">{supplier.role}</span>
                <span className="mt-1 block text-sm text-slate-600">{supplier.references.map(reference => reference.product).join(' · ')}</span>
              </button>
            </li>)}
          </ul>
          <article className="surface space-y-5 p-5 sm:p-7" aria-labelledby="supplier-heading">
            <div>
              <p className="text-sm font-medium text-forest">{selected.role}</p>
              <h2 id="supplier-heading" className="mt-1 text-2xl font-semibold">{selected.name}</h2>

            </div>
            <section>
              <h3 className="font-semibold">Préparations publiées par le fabricant</h3>
              <PublishedReferences references={selected.references.filter(reference => !product || reference.product === product)} />
              <p className="mt-2 text-sm text-slate-600">Avant de chiffrer, demandez la fiche technique, le conditionnement exact, la quantité minimale et les certificats de l’unité pour le produit proposé.</p>
            </section>
            <section>
              <h3 className="font-semibold">Acheteurs à approcher</h3>
              <p className="mt-1 text-sm text-slate-600">Rapprochements fondés sur les gammes publiées. La relation commerciale et le besoin d’achat restent à confirmer.</p>
              {matches.length ? (
                <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200 px-3">
                  {matches.map(({ buyer, common }) => <li key={buyer.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div><p className="font-semibold">{buyer.name}</p><p className="text-sm text-slate-600">{common.join(' · ')}</p></div>
                    <button type="button" className="secondary-button" onClick={() => onBuyer(buyer.id)}>Examiner la fiche</button>
                  </li>)}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-600">Aucun acheteur de la sélection ne correspond à cette gamme.</p>}
            </section>
            <details className="border-t border-stone-200 pt-4" open>
              <summary className="cursor-pointer font-semibold">Unités et vérifications</summary>
              {selected.sites.length ? <ul className="mt-3 space-y-3">
                {selected.sites.map(site => <li key={site.city}>
                  <a className="font-medium text-forest underline" href={site.url} target="_blank" rel="noreferrer">{site.city}</a>
                  <p className="text-sm text-slate-700">{site.detail}</p>
                </li>)}
              </ul> : <p className="mt-3 text-sm text-slate-700">Demandez le nom et le numéro d’agrément de l’unité pour le produit proposé.</p>}
              <p className="mt-3 text-sm text-slate-700">Identité légale et agrément de l’unité à vérifier dans <button type="button" className="font-semibold text-forest underline" onClick={() => setView('Organismes et marché')}>Organismes et marché</button>.</p>
            </details>
            <section className="border-t border-stone-200 pt-4">
              <h3 className="font-semibold">Sources consultées le {showDay(corridor.observedAt)}</h3>
              <ul className="mt-3 space-y-3">
                {selected.evidence.map(source => <li key={source.url}>
                  <a className="font-semibold text-forest underline" href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                  <p className="mt-1 text-sm text-slate-700">{source.summary}</p>
                </li>)}
              </ul>
            </section>
          </article>
        </div>
      ))}

      {view === 'Acheteurs en France' && (
        visibleBuyers.length ? <ul className="grid gap-4 md:grid-cols-2">
          {visibleBuyers.map(buyer => <li className="surface p-5" key={buyer.id}>
            <h2 className="text-lg font-semibold">{buyer.name}</h2>
            <p className="mt-1 text-sm text-slate-700">Produits repérés dans son catalogue</p>
            <PublishedReferences references={referencesFor(buyer.id, product)} />
            <p className="mt-3 text-sm text-slate-600">À demander à l’acheteur&nbsp;: origine acceptée, recette, format, volume et certifications exigées.</p>
            <button type="button" className="secondary-button mt-4" onClick={() => onBuyer(buyer.id)}>Examiner la fiche</button>
          </li>)}
        </ul> : <div className="surface p-5">
          <p>Aucune entreprise de la sélection ne correspond aux filtres.</p>
          <button type="button" className="secondary-button mt-3" onClick={() => { setProduct(''); setBuyerQuery('') }}>
            Voir toutes les entreprises
          </button>
        </div>
      )}
      {view === 'Opportunités' && <OpportunityView followed={followed} />}
      {view === 'Organismes et marché' && (
        <section aria-labelledby="institutions-heading">
          <h2 id="institutions-heading" className="mb-3 text-xl font-semibold">Sources officielles du corridor</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {corridorResources.map(resource => <li key={resource.url} className="surface p-5">
              <p className="text-sm font-medium text-forest">{resource.category}</p>
              <a className="mt-1 inline-block font-semibold text-forest underline" href={resource.url} target="_blank" rel="noreferrer">{resource.name}</a>
              <p className="mt-2 text-sm text-slate-700">{resource.purpose}</p>
            </li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
