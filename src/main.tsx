import { StrictMode, useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { defaultSearch, type Lead, type Search } from './prospects'
import { attachEvidence, createSession, createSource, discoveryConfig, loadSessions, loadSources, retryDiscovery, saveFollowUp, saveReview } from './api'
import { approvedLeads, decisions, type Decision, type EvidenceInput, type Review, type Session, type Source } from './research'
import { EvidenceForm, FollowUpForm, Resources, inputClass } from './resources'
import { matchesLead, searchable, type EvidenceFilter, type ReviewFilter } from './lead-filters'
import { sourceKind, sourceKinds } from './source-quality'
import { missions } from './missions'
import './styles.css'

const statusLabels = {
  corroborated: { label: 'Sources concordantes', style: 'bg-emerald-100 text-emerald-900' },
  missing: { label: 'Contact manquant', style: 'bg-amber-100 text-amber-950' },
  documented: { label: 'Identité et gamme documentées', style: 'bg-emerald-100 text-emerald-900' },
  unverified: { label: 'Candidat à vérifier', style: 'bg-amber-100 text-amber-950' },
  conflict: { label: 'Identité à vérifier', style: 'bg-rose-100 text-rose-950' },
}

const dateTime = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
})

function ReviewForm({ review, onSave }: {
  review: Review | undefined
  onSave: (decision: Decision, reason: string) => Promise<void>
}) {
  const [decision, setDecision] = useState<Decision | ''>(review?.decision ?? '')
  const [reason, setReason] = useState(review?.reason ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaved(false)
    if (!decision || !reason.trim()) {
      setError('Choisissez une décision et saisissez un motif.')
      return
    }
    setSaving(true)
    try {
      await onSave(decision, reason)
      setSaved(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Impossible d’enregistrer la décision.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form id="lead-review" tabIndex={-1} onSubmit={submit} className="mt-6 scroll-mt-4 rounded-lg border border-stone-200 p-4">
      <h4 className="text-lg font-semibold">Décision de revue</h4>
      {review && (
        <p className="mt-1 break-words text-sm text-stone-700">
          {decisions[review.decision]} · {dateTime.format(new Date(review.reviewedAt))} · {review.reason}
        </p>
      )}
      <fieldset disabled={saving} className="mt-3 space-y-3">
        <label className="block text-sm font-semibold">Décision
          <select className={inputClass} required value={decision} onChange={event => {
            setDecision(event.target.value as Decision | '')
            setSaved(false)
          }}>
            <option value="" disabled>Choisir une décision</option>
            <option value="approved">Approuver</option>
            <option value="flagged">Signaler</option>
            <option value="dismissed">Écarter</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">Motif
          <textarea className={inputClass} required maxLength={500} rows={2} value={reason}
            onChange={event => { setReason(event.target.value); setSaved(false) }} />
        </label>
        <button type="submit" className="rounded-lg bg-forest px-4 py-2 font-semibold text-white disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer la décision'}
        </button>
      </fieldset>
      {error && <p role="alert" className="mt-2 text-sm text-rose-800">{error}</p>}
      {saved && <p role="status" className="mt-2 text-sm text-emerald-800">Décision enregistrée.</p>}
    </form>
  )
}

function LeadDetail({ lead, review, sources, onSave, onAttach, onResources }: {
  lead: Lead
  review: Review | undefined
  sources: Source[]
  onSave?: (decision: Decision, reason: string) => Promise<void>
  onAttach?: (input: EvidenceInput) => Promise<void>
  onResources: () => void
}) {
  const status = statusLabels[lead.status]

  return (
    <article aria-labelledby="lead-name" className="surface min-w-0 p-5 sm:p-6">
      <a href="#results-heading" className="mb-4 block text-sm font-semibold text-forest underline lg:hidden">Retour aux résultats</a>
      <span className={`rounded-full px-3 py-1 text-sm font-medium ${status.style}`}>{status.label}</span>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h3 id="lead-name" tabIndex={-1} className="text-2xl font-semibold">{lead.name}</h3>
        {onSave && <a href="#lead-review" className="secondary-button inline-flex items-center">
          {review ? 'Modifier la décision' : 'Enregistrer une décision'}
        </a>}
      </div>
      <p className="mt-2 text-stone-700">{lead.reason}</p>
      <dl className="mt-4 rounded-lg bg-paper p-4">
        <dt className="text-sm font-semibold">Contact achats</dt>
        <dd className="mt-1 break-words">{lead.contact ?? 'Aucun contact achats documenté'}</dd>
      </dl>
      <h4 className="mb-3 mt-6 text-lg font-semibold">Éléments de preuve</h4>
      <ul className="space-y-3">
        {lead.evidence.map((claim) => {
          const quality = sourceKinds[sourceKind(claim.url, claim.sourceType)]
          return <li key={claim.id ?? claim.field} className="rounded-lg border border-stone-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="font-semibold">{claim.field}</h5>
              <span className="rounded-md bg-paper px-2 py-1 text-xs font-medium text-forest">{quality.label}</span>
            </div>
            {claim.paraphrased
              ? <p className="my-2 border-l-2 border-emerald-600 pl-3 text-stone-700">{claim.excerpt}</p>
              : <blockquote className="my-2 border-l-2 border-emerald-600 pl-3 text-stone-700">{claim.excerpt}</blockquote>}
            <p className="text-sm text-stone-700">
              {claim.source} · {claim.manual ? 'Saisie manuelle' : claim.paraphrased ? 'Synthèse de la source' : 'Source consultée'} · <time dateTime={claim.observedAt}>{claim.observedAt}</time>
            </p>
            <p className="mt-1 break-all text-sm text-stone-600">
              {claim.manual || claim.live ? <a className="underline" href={claim.url} target="_blank" rel="noreferrer">{claim.url}</a> : claim.url}
            </p>
            <p className="mt-2 text-sm text-slate-600">{quality.use}</p>
          </li>
        })}
      </ul>
      {onAttach && <EvidenceForm sources={sources} onAttach={onAttach} onResources={onResources} />}
      {onSave && <ReviewForm key={lead.evidence.length} review={review} onSave={onSave} />}
    </article>
  )
}

const reviewFilters = [
  ['all', 'Tous'], ['pending', 'À examiner'], ['approved', 'Approuvés'], ['flagged', 'Signalés'], ['dismissed', 'Écartés'],
] as const

const sections = {
  research: 'Prospects',
  shortlist: 'Liste prioritaire',
  resources: 'Ressources',
  guide: 'Mode d’emploi',
} as const

type Section = keyof typeof sections

function Guide({ onSearch }: { onSearch: () => void }) {
  return (
    <section className="surface max-w-3xl space-y-5 p-6 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold">De la recherche à la liste prioritaire</h2>
        <p className="mt-2 text-slate-600">Commencez par examiner les entreprises et leurs sources dans la sélection préparée. Lancez une nouvelle recherche si vous souhaitez trouver d’autres prospects.</p>
      </div>
      <ol className="space-y-4 pl-5 text-slate-700 marker:font-semibold marker:text-forest list-decimal">
        <li><strong>Ouvrir la sélection.</strong> Les premières fiches sont disponibles dès l’ouverture. <em>Nouvelle recherche</em> permet d’élargir la sélection avec une mission ou vos propres critères lorsque le service web est connecté.</li>
        <li><strong>Filtrer les résultats.</strong> Tapez un nom, un contact ou une source. Cliquez sur <em>À examiner</em> pour afficher les décisions en attente. Le filtre <em>État des preuves</em> permet par exemple d’isoler les contacts manquants.</li>
        <li><strong>Examiner une fiche.</strong> Ouvrez les extraits et leurs sources. Ajoutez une source depuis <em>Ressources</em>, puis rattachez-la à la fiche si nécessaire.</li>
        <li><strong>Décider et exporter.</strong> Approuvez, signalez ou écartez le prospect avec un motif. Les prospects approuvés vont dans la liste prioritaire pour le suivi et l’export Excel.</li>
      </ol>
      <p className="border-t border-slate-200 pt-4 text-sm text-slate-600">Dans <strong>Activité de la session</strong>, suivez la découverte des pages et la qualification des candidats. La recherche web repère des mentions du produit et montre les extraits. Vous confirmez l’identité et le profil commercial de l’entreprise avant de l’approuver.</p>
      <button type="button" className="primary-button" onClick={onSearch}>Ouvrir la recherche</button>
    </section>
  )
}

function App() {
  const [section, setSection] = useState<Section>('research')
  const [showMissions, setShowMissions] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>('all')
  const [shortlistQuery, setShortlistQuery] = useState('')
  const [search, setSearch] = useState(defaultSearch)
  const [configuration, setConfiguration] = useState({ enabled: false, version: '', logPath: '' })
  const liveEnabled = configuration.enabled
  const [sessions, setSessions] = useState<Session[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [activeId, setActiveId] = useState('')
  const [selected, setSelected] = useState('atlas')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const catalogue = sessions.find(session => session.mode === 'prepared')
  const run = sessions.find(session => session.id === activeId)
  const liveRunning = run?.tasks?.some(task => task.state === 'queued') ?? false
  const running = liveEnabled && liveRunning
  const hasQueued = sessions.some(session => session.tasks?.some(task => task.state === 'queued'))

  useEffect(() => {
    let active = true
    Promise.all([loadSessions(), loadSources(), discoveryConfig()]).then(([history, resources, config]) => {
      if (!active) return
      setSessions(history)
      setSources(resources)
      setConfiguration(config)
      const initial = history.find(session => session.mode === 'prepared') ?? history[0]
      setActiveId(initial?.id ?? '')
      setSelected(initial?.leads[0]?.id ?? '')
    }).catch(() => {
      if (active) setError('Impossible de charger les sessions locales. Actualisez la page pour réessayer.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!liveEnabled || !hasQueued) return
    let cancelled = false
    let timer: number
    async function poll() {
      try {
        const latest = await loadSessions()
        if (!cancelled) setSessions(previous => previous.map(session =>
          session.tasks?.some(task => task.state === 'queued')
            ? latest.find(item => item.id === session.id) ?? session : session,
        ))
      } catch {
        // A temporary disconnection leaves the last recorded progress visible.
      } finally {
        if (!cancelled) timer = window.setTimeout(poll, 1000)
      }
    }
    timer = window.setTimeout(poll, 1000)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [hasQueued, liveEnabled])

  async function launch(criteria: Search) {
    const product = criteria.product.trim()
    if (!product || !liveEnabled || starting || loading || running) return
    setError('')
    setStarting(true)
    try {
      const session = await createSession({ ...criteria, product })
      setSessions(previous => [session, ...previous])
      setActiveId(session.id)
      setSelected(session.leads[0]?.id ?? '')
      resetFilters()
      setShowSearch(false)
      setShowMissions(false)
      requestAnimationFrame(() => document.getElementById('session-activity')?.focus())
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Impossible de créer la session.')
    } finally {
      setStarting(false)
    }
  }

  function navigate(next: Section) {
    setSection(next)
    window.scrollTo(0, 0)
  }

  function resetFilters() {
    setQuery('')
    setReviewFilter('all')
    setEvidenceFilter('all')
  }

  function openSession(session: Session, leadId = session.leads[0]?.id ?? '') {
    setActiveId(session.id)
    setSelected(leadId)
    resetFilters()
    setShowSearch(false)
    setShowMissions(false)
  }

  function focusLead() {
    requestAnimationFrame(() => {
      const heading = document.getElementById('lead-name')
      heading?.focus({ preventScroll: true })
      heading?.scrollIntoView({ block: 'start' })
    })
  }

  function updateSession(updated: Session) {
    setSessions(previous => previous.map(session => session.id === updated.id ? updated : session))
  }

  async function retry() {
    if (!run || starting) return
    setStarting(true)
    setError('')
    try {
      updateSession(await retryDiscovery(run.id))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'La relance a échoué.')
    } finally {
      setStarting(false)
    }
  }

  const leads = run?.leads ?? []
  const filteredLeads = leads.filter(lead => matchesLead(lead, run?.reviews[lead.id], query, reviewFilter, evidenceFilter))
  const activeLead = filteredLeads.find(lead => lead.id === selected) ?? filteredLeads[0]
  const shortlist = approvedLeads(sessions)
  const visibleShortlist = shortlist.filter(({ session, lead }) =>
    searchable(`${lead.name} ${session.search.product} ${session.search.market} ${session.followUps[lead.id]?.owner ?? ''}`)
      .includes(searchable(shortlistQuery)),
  )
  const filtersActive = query.trim() !== '' || reviewFilter !== 'all' || evidenceFilter !== 'all'
  const discoveredSources = [...new Map(sessions.flatMap(session => session.leads)
    .flatMap(lead => lead.evidence).filter(claim => !claim.manual)
    .map(claim => [claim.url, claim] as const)).values()]

  return (
    <div className="workspace">
      <aside className="workspace-nav">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">HA</span>
          <div>
            <p className="font-semibold">HA Prospection</p>
            <p className="text-xs text-emerald-100/75">Recherche agroalimentaire</p>
          </div>
        </div>
        <nav aria-label="Navigation principale" className="workspace-links">
          {(Object.keys(sections) as Section[]).map(item => (
            <button key={item} type="button" aria-current={section === item ? 'page' : undefined}
              className="workspace-link" onClick={() => navigate(item)}>
              <span>{sections[item]}</span>
              {item === 'shortlist' && <span className="nav-count">{shortlist.length}</span>}
            </button>
          ))}
        </nav>
        <div className="nav-footer">
          <p>Données sur ce PC</p>
          {configuration.version && <p>Version {configuration.version}</p>}
        </div>
      </aside>

      <main className="workspace-main">
        <header className="page-header">
          <div>
            <h1>{section === 'research' ? 'Prospects' : sections[section]}</h1>
            <p>{{
              research: 'Examinez les prospects déjà documentés ou lancez une recherche pour élargir la sélection.',
              shortlist: 'Retrouvez les prospects approuvés et planifiez les relances.',
              resources: 'Consultez les sources et ajoutez vos propres références.',
              guide: 'Suivez le parcours de la première recherche à l’export.',
            }[section]}</p>
          </div>
          {section === 'research' && (
            <div className="flex flex-wrap gap-2">
              {catalogue && run?.id !== catalogue.id && (
                <button type="button" className="secondary-button" onClick={() => openSession(catalogue)}>
                  Voir la sélection préparée
                </button>
              )}
              <button type="button" className="primary-button" aria-expanded={showMissions} aria-controls="web-search-options"
                onClick={() => setShowMissions(!showMissions)}>
                {showMissions ? 'Masquer les options de recherche' : 'Nouvelle recherche'}
              </button>
            </div>
          )}
        </header>

        {section === 'research' && <>
        {showMissions && (
          <section id="web-search-options" aria-labelledby="missions-heading" className="surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="missions-heading" className="text-xl font-semibold">Missions prêtes à lancer</h2>
              <span className="mode-label">{loading ? 'Vérification du service…' : liveEnabled ? 'Recherche web disponible' : 'Service web à connecter'}</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {missions.map(mission => (
                <article key={mission.id} className="flex flex-col items-start rounded-xl border border-[#d9e3de] bg-paper p-4">
                  <h3 className="font-semibold">{mission.title}</h3>
                  <p className="my-2 text-sm text-slate-600">{mission.search.product} · {mission.search.market}</p>
                  <button type="button" className="primary-button mt-auto" disabled={!liveEnabled || loading || starting || running}
                    aria-label={`Lancer la mission : ${mission.title}`}
                    onClick={() => void launch(mission.search)}>
                    Lancer la mission
                  </button>
                </article>
              ))}
            </div>
            {!loading && !liveEnabled && (
              <p className="mt-3 text-sm text-slate-600">Pour lancer une recherche, connectez le service web lors de l’installation. Les résultats déjà enregistrés restent disponibles.</p>
            )}
            <button type="button" className="secondary-button mt-4" aria-expanded={showSearch}
              aria-controls="search-form" onClick={() => {
                setShowSearch(!showSearch)
                if (!showSearch) requestAnimationFrame(() => document.getElementById('search-product')?.focus())
              }}>
              {showSearch ? 'Masquer la recherche personnalisée' : 'Personnaliser une recherche'}
            </button>
          </section>
        )}
        <form id="search-form" onSubmit={event => { event.preventDefault(); void launch(search) }}
          className="surface mt-4 p-5 sm:p-6" hidden={!showMissions || !showSearch}>
          <h2 className="mb-4 text-lg font-semibold">Critères de recherche</h2>
          <fieldset disabled={running || starting || loading} className="grid gap-4 disabled:opacity-70 md:grid-cols-3">
            <label className="text-sm font-semibold">Produit
              <input id="search-product" className={inputClass} required pattern={String.raw`.*\S.*`} maxLength={100} value={search.product}
                onChange={(event) => setSearch({ ...search, product: event.target.value })} />
            </label>
            <label className="text-sm font-semibold">Marché
              <select className={inputClass} value={search.market}
                onChange={(event) => setSearch({ ...search, market: event.target.value })}>
                <option>France</option><option>Maroc</option><option>Espagne</option><option>Sénégal</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Type d’entreprise
              <select className={inputClass} value={search.role}
                onChange={(event) => setSearch({ ...search, role: event.target.value })}>
                <option>Importateurs et distributeurs</option><option>Fournisseurs</option><option>Acheteurs</option>
              </select>
            </label>
            <button type="submit" disabled={!liveEnabled} className="self-end rounded-lg bg-forest px-4 py-3 font-semibold text-white enabled:hover:bg-emerald-900 disabled:cursor-wait">
              {running || starting ? 'Recherche en cours…' : 'Lancer la recherche'}
            </button>
          </fieldset>
        </form>

        {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-rose-900">{error}</p>}

        {sessions.length > 0 && (
          <section className="surface mt-4 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block min-w-0 text-sm font-semibold">Sessions enregistrées
              <select className={inputClass} value={activeId} disabled={starting}
                onChange={event => {
                  const session = sessions.find(item => item.id === event.target.value)
                  if (session) openSession(session)
                }}>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.mode === 'prepared' ? 'Sélection préparée · ' : ''}{session.search.product} · {session.search.market} · {dateTime.format(new Date(session.createdAt))}
                  </option>
                ))}
              </select>
            </label>
            {run && <span className="mode-label">{run.mode === 'prepared' ? 'Sélection préparée' : 'Recherche web'}</span>}
          </section>
        )}

        {run?.mode === 'prepared' && (
          <section aria-labelledby="catalogue-heading" className="surface mt-4 p-5 sm:p-6">
            <h2 id="catalogue-heading" className="text-xl font-semibold">{run.search.product} · {run.search.market}</h2>
            <p className="mt-2 text-slate-700">{run.leads.length} entreprises à examiner. Leur identité a été contrôlée dans le registre français et leur gamme est documentée par leur site.</p>
            <p className="mt-2 text-sm text-slate-600">Vérifiez l’intérêt pour votre offre et le bon interlocuteur avant de prendre contact. Les dates de consultation figurent dans chaque fiche.</p>
          </section>
        )}

        {run?.mode === 'live' && (
          <section aria-labelledby="session-activity" className="surface mt-4 p-5 sm:p-6">
            <h2 id="session-activity" tabIndex={-1} className="text-xl font-semibold">Activité de la session</h2>
            <p className="mt-1 text-sm text-stone-700">{run.search.product} · {run.search.market} · {run.search.role}</p>
            <p role="status" className="mt-3 font-medium">
              {liveRunning ? liveEnabled ? 'Recherche en cours…' : 'Recherche en attente de la connexion au service web.'
                : run.tasks?.filter(task => task.kind === 'search').every(task => task.state === 'failed')
                  ? 'Recherche échouée · Le moteur n’a renvoyé aucun résultat.'
                  : run.tasks?.some(task => task.state === 'failed') ? 'Recherche partielle · Certaines sources ont échoué.'
                  : 'Recherche terminée.'} · {leads.length} candidat(s)
            </p>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              <li className="rounded-lg bg-paper px-4 py-3">
                <p className="font-semibold">Découverte</p>
                <p className="mt-1 text-sm text-slate-600">{run.tasks?.filter(task => task.kind === 'page').length ?? 0} page(s) à consulter ou consultée(s)</p>
              </li>
              <li className="rounded-lg bg-paper px-4 py-3">
                <p className="font-semibold">Qualification</p>
                <p className="mt-1 text-sm text-slate-600">{leads.length} candidat(s) avec un extrait pertinent</p>
              </li>
              <li className="rounded-lg bg-paper px-4 py-3">
                <p className="font-semibold">Votre revue</p>
                <p className="mt-1 text-sm text-slate-600">Confirmer l’entreprise et son activité</p>
              </li>
            </ol>
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Requêtes et pages consultées</summary>
              <ul className="mt-2 divide-y divide-stone-200">
                {run.tasks?.map(task => (
                  <li key={`${task.kind}/${task.input}`} className="break-all py-2 text-sm">
                    <p>{task.input}</p>
                    <p className={task.state === 'failed' ? 'text-rose-800' : 'text-stone-700'}>
                      {task.state === 'queued' ? 'En attente ou en cours' : task.detail}
                      {task.attempts ? ` · ${task.attempts} tentative(s)` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
            {!liveRunning && leads.length === 0 && (
              <p className="mt-4 text-sm text-stone-700">
                Aucun candidat avec un extrait exploitable. Consultez les résultats de chaque étape avant de modifier les critères.
              </p>
            )}
            {!liveRunning && !run.retried && liveEnabled && run.tasks?.some(task => task.state === 'failed') && (
              <button type="button" disabled={starting} onClick={retry} className="mt-4 rounded-lg bg-forest px-4 py-2 text-white">
                Relancer les étapes en échec
              </button>
            )}
          </section>
        )}

        {run && leads.length > 0 && (
          <section aria-labelledby="results-heading" className="mt-6">
            <div className="mb-4">
              <h2 id="results-heading" tabIndex={-1} className="text-xl font-semibold">{run.mode === 'prepared' ? 'Prospects de la sélection' : 'Prospects de la session'}</h2>
              <p className="mt-1 text-sm text-slate-600">Sélectionnez un résultat pour consulter ses preuves et enregistrer votre décision.</p>
            </div>
            <div className="surface mb-4 p-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Décision de revue">
                {reviewFilters.map(([filter, label]) => (
                  <button type="button" className="filter-pill" key={filter} aria-pressed={reviewFilter === filter}
                    onClick={() => setReviewFilter(filter)}>{label} <span>{leads.filter(lead => matchesLead(lead, run.reviews[lead.id], '', filter, 'all')).length}</span></button>
                ))}
              </div>
              <div className="mt-3 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <label className="text-sm font-semibold">Rechercher dans les résultats
                  <input className={inputClass} type="search" placeholder="Entreprise, contact, source…" value={query}
                    onChange={event => setQuery(event.target.value)} />
                </label>
                <label className="text-sm font-semibold">État des preuves
                  <select className={inputClass} value={evidenceFilter}
                    onChange={event => setEvidenceFilter(event.target.value as EvidenceFilter)}>
                    <option value="all">Tous les états</option>
                    {Object.entries(statusLabels).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
                  </select>
                </label>
                {filtersActive && <button type="button" className="secondary-button" onClick={resetFilters}>Réinitialiser</button>}
              </div>
              <p role="status" className="mt-3 text-sm text-slate-600">{filteredLeads.length} résultat(s) sur {leads.length}</p>
            </div>
            {activeLead ? <div className="grid items-start gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.6fr)]">
              <ul aria-label="Prospects" className="space-y-2 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:p-1">
                {filteredLeads.map((lead) => {
                  const review = run.reviews[lead.id]
                  return <li key={lead.id}>
                    <button type="button" aria-pressed={activeLead.id === lead.id} onClick={() => {
                        setSelected(lead.id)
                        if (window.matchMedia('(max-width: 63.99rem)').matches) focusLead()
                      }}
                      className="lead-row">
                      <span className="block font-semibold">{lead.name}</span>
                      <span className="mt-1 block text-sm text-stone-700">{statusLabels[lead.status].label}</span>
                      <span className="mt-1 block text-sm font-medium">
                        {review ? decisions[review.decision] : 'À examiner'}
                      </span>
                    </button>
                  </li>
                })}
              </ul>
              <LeadDetail key={`${run.id}/${activeLead.id}`} lead={activeLead} review={run.reviews[activeLead.id]} sources={sources} onResources={() => navigate('resources')}
                onAttach={running ? undefined : async input => updateSession(await attachEvidence(run.id, activeLead.id, input))}
                onSave={running ? undefined : async (decision, reason) => updateSession(await saveReview(run.id, activeLead.id, decision, reason))} />
            </div> : <p className="surface p-5 text-slate-700">Aucun prospect ne correspond à ces filtres.</p>}
          </section>
        )}
        </>}
        {section === 'shortlist' && <section aria-labelledby="shortlist-heading" className="surface mt-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="shortlist-heading" className="text-xl font-semibold">Prospects approuvés ({shortlist.length})</h2>
            {shortlist.length > 0 && (
              <a href="/api/shortlist/export.xlsx" download className="rounded-lg bg-forest px-4 py-2 font-semibold text-white">
                Exporter Excel
              </a>
            )}
          </div>
          {shortlist.length > 0 && <label className="mt-4 block max-w-lg text-sm font-semibold">Filtrer la liste prioritaire
            <input type="search" className={inputClass} placeholder="Entreprise, produit, marché, responsable…" value={shortlistQuery}
              onChange={event => setShortlistQuery(event.target.value)} />
            <span className="mt-2 block font-normal text-slate-600">{visibleShortlist.length} résultat(s) sur {shortlist.length} · L’export inclut toute la liste.</span>
          </label>}
          {shortlist.length === 0 ? (
            <p className="mt-2 text-stone-700">Les prospects approuvés apparaîtront ici.</p>
          ) : visibleShortlist.length === 0 ? (
            <p className="mt-4 text-slate-700">Aucun prospect ne correspond à ce filtre.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-200">
              {visibleShortlist.map(({ session, lead }) => (
                <li key={`${session.id}/${lead.id}`} className="py-3">
                  <button type="button" disabled={running || starting} onClick={() => {
                    openSession(session, lead.id)
                    setSection('research')
                    focusLead()
                  }} className="text-left font-semibold text-forest enabled:underline disabled:opacity-60">
                    {lead.name}
                  </button>
                  <p className="text-sm text-stone-700">{session.search.product} · {session.search.market} · {dateTime.format(new Date(session.createdAt))}</p>
                  <FollowUpForm followUp={session.followUps[lead.id]}
                    onSave={async input => updateSession(await saveFollowUp(session.id, lead.id, input))} />
                </li>
              ))}
            </ul>
          )}
        </section>}
        {section === 'resources' && <Resources sources={sources} discovered={discoveredSources} onAdd={async input => {
          const source = await createSource(input)
          setSources(previous => [...previous, source].sort((first, second) => first.name.localeCompare(second.name, 'fr')))
        }} />}
        {section === 'guide' && <Guide onSearch={() => navigate('research')} />}
        {configuration.logPath && (
          <footer className="mt-7 space-y-1 break-words text-sm text-stone-700">
            <p>Journal local · {configuration.logPath}</p>
          </footer>
        )}
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
