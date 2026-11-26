import { StrictMode, useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { defaultSearch, steps, type Lead, type Scenario } from './fixtures'
import { attachEvidence, createSession, createSource, discoveryConfig, loadSessions, loadSources, retryDiscovery, saveFollowUp, saveReview } from './api'
import { approvedLeads, decisions, type Decision, type EvidenceInput, type Review, type Session, type Source } from './research'
import { EvidenceForm, FollowUpForm, Resources, inputClass } from './resources'
import './styles.css'

const statusLabels = {
  corroborated: { label: 'Sources concordantes', style: 'bg-emerald-100 text-emerald-900' },
  missing: { label: 'Contact manquant', style: 'bg-amber-100 text-amber-950' },
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
    <form onSubmit={submit} className="mt-6 rounded-lg border border-stone-200 p-4">
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

function LeadDetail({ lead, review, sources, onSave, onAttach }: {
  lead: Lead
  review: Review | undefined
  sources: Source[]
  onSave?: (decision: Decision, reason: string) => Promise<void>
  onAttach?: (input: EvidenceInput) => Promise<void>
}) {
  const status = statusLabels[lead.status]

  return (
    <article aria-labelledby="lead-name" className="min-w-0 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
      <span className={`rounded-full px-3 py-1 text-sm font-medium ${status.style}`}>{status.label}</span>
      <h3 id="lead-name" tabIndex={-1} className="mt-4 text-2xl font-semibold">{lead.name}</h3>
      <p className="mt-2 text-stone-700">{lead.reason}</p>
      <dl className="mt-4 rounded-lg bg-paper p-4">
        <dt className="text-sm font-semibold">Contact achats</dt>
        <dd className="mt-1 break-words">{lead.contact ?? 'Aucun contact public dans les sources de cet exemple'}</dd>
      </dl>
      <h4 className="mb-3 mt-6 text-lg font-semibold">Éléments de preuve</h4>
      <ul className="space-y-3">
        {lead.evidence.map((claim) => (
          <li key={claim.id ?? claim.field} className="rounded-lg border border-stone-200 p-4">
            <h5 className="font-semibold">{claim.field}</h5>
            <blockquote className="my-2 border-l-2 border-emerald-600 pl-3 text-stone-700">{claim.excerpt}</blockquote>
            <p className="text-sm text-stone-700">
              {claim.source} · {claim.manual ? 'Saisie manuelle' : claim.live ? 'Page consultée' : 'Fictif'} · <time dateTime={claim.observedAt}>{claim.observedAt}</time>
            </p>
            <p className="mt-1 break-all text-sm text-stone-600">
              {claim.manual || claim.live ? <a className="underline" href={claim.url} target="_blank" rel="noreferrer">{claim.url}</a> : claim.url}
            </p>
          </li>
        ))}
      </ul>
      {onAttach && <EvidenceForm sources={sources} onAttach={onAttach} />}
      {onSave && <ReviewForm key={lead.evidence.length} review={review} onSave={onSave} />}
    </article>
  )
}

function App() {
  const [search, setSearch] = useState(defaultSearch)
  const [configuration, setConfiguration] = useState({ enabled: false, version: '', logPath: '' })
  const liveEnabled = configuration.enabled
  const [mode, setMode] = useState<'sample' | 'live'>('sample')
  const [scenario, setScenario] = useState<Scenario>('complete')
  const [sessions, setSessions] = useState<Session[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [activeId, setActiveId] = useState('')
  const [stage, setStage] = useState(steps.length)
  const [selected, setSelected] = useState('atlas')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const run = sessions.find(session => session.id === activeId)
  const simulating = run !== undefined && run.mode !== 'live' && stage < steps.length
  const liveRunning = run?.tasks?.some(task => task.state === 'queued') ?? false
  const running = simulating || (liveEnabled && liveRunning)
  const hasQueued = sessions.some(session => session.tasks?.some(task => task.state === 'queued'))

  useEffect(() => {
    let active = true
    Promise.all([loadSessions(), loadSources(), discoveryConfig()]).then(([history, resources, config]) => {
      if (!active) return
      setSessions(history)
      setSources(resources)
      setConfiguration(config)
      setActiveId(history[0]?.id ?? '')
      setSelected(history[0]?.leads[0]?.id ?? '')
    }).catch(() => {
      if (active) setError('Impossible de charger les sessions locales. Actualisez la page pour réessayer.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!simulating) return
    const timer = window.setTimeout(() => setStage(stage + 1), 650)
    return () => window.clearTimeout(timer)
  }, [simulating, stage])

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

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const product = search.product.trim()
    if (!product || starting || loading || running) return
    setError('')
    setStarting(true)
    try {
      const session = await createSession({ ...search, product }, scenario, mode === 'live' ? 'live' : undefined)
      setSessions(previous => [session, ...previous])
      setActiveId(session.id)
      setStage(session.mode === 'live' ? steps.length : 0)
      setSelected(session.leads[0]?.id ?? '')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Impossible de créer la session.')
    } finally {
      setStarting(false)
    }
  }

  function openSession(session: Session, leadId = session.leads[0]?.id ?? '') {
    setActiveId(session.id)
    setStage(steps.length)
    setSelected(leadId)
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

  const leads = run && (run.mode === 'live' || stage >= 2) ? run.leads : []
  const activeLead = leads.find((lead) => lead.id === selected) ?? leads[0]
  const shortlist = approvedLeads(sessions)
  const fixtureSources = [...new Map(sessions.flatMap(session => session.leads)
    .flatMap(lead => lead.evidence).filter(claim => !claim.manual)
    .map(claim => [claim.url, claim] as const)).values()]

  return (
    <>
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-emerald-200 px-2.5 py-1.5 text-sm font-bold text-ink" aria-hidden="true">HA</span>
            <p className="font-semibold">HA Prospection</p>
          </div>
          <nav aria-label="Navigation" className="flex gap-4 text-sm text-emerald-100">
            <a href="#resources-heading" className="hover:underline">Ressources</a>
            <a href="#shortlist-heading" className="hover:underline">Liste prioritaire</a>
          </nav>
          <p className="text-sm text-emerald-100">Données stockées sur ce PC</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-9 md:px-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Recherche de prospects</h1>
        <p className="mt-2 text-stone-700">Examinez les sources de chaque résultat avant de retenir un prospect.</p>

        <form onSubmit={start} className="mt-6 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
          <fieldset disabled={running || starting || loading} className="grid gap-4 disabled:opacity-70 md:grid-cols-3">
            <label className="text-sm font-semibold">Produit
              <input className={inputClass} required pattern={String.raw`.*\S.*`} maxLength={100} value={search.product}
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
            <label className="text-sm font-semibold">Mode
              <select className={inputClass} value={mode} onChange={event => setMode(event.target.value === 'live' ? 'live' : 'sample')}>
                <option value="sample">Démonstration · Données fictives</option>
                <option value="live" disabled={!liveEnabled}>Recherche web · Brave Search</option>
              </select>
              {!liveEnabled && <span className="mt-2 block text-stone-600">Clé Brave Search requise pour la recherche web.</span>}
            </label>
            {mode === 'sample' && <label className="text-sm font-semibold">Scénario de démonstration
              <select className={inputClass} value={scenario}
                onChange={(event) => setScenario(event.target.value === 'partial' ? 'partial' : 'complete')}>
                <option value="complete">Toutes les sources répondent</option>
                <option value="partial">Une source ne répond pas</option>
              </select>
            </label>}
            <button type="submit" className="self-end rounded-lg bg-forest px-4 py-3 font-semibold text-white enabled:hover:bg-emerald-900 disabled:cursor-wait">
              {running || starting ? 'Recherche en cours…' : 'Lancer la recherche'}
            </button>
          </fieldset>
        </form>

        {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-rose-900">{error}</p>}

        {sessions.length > 0 && (
          <label className="mt-6 block max-w-lg text-sm font-semibold">Sessions enregistrées
            <select className={inputClass} value={activeId} disabled={running || starting}
              onChange={event => {
                const session = sessions.find(item => item.id === event.target.value)
                if (session) openSession(session)
              }}>
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.search.product} · {session.search.market} · {session.mode === 'live' ? 'Web' : 'Démo'} · {dateTime.format(new Date(session.createdAt))}
                </option>
              ))}
            </select>
          </label>
        )}

        {run?.mode === 'live' && (
          <section aria-labelledby="live-heading" className="mt-7 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 id="live-heading" className="text-xl font-semibold">Recherche web</h2>
            <p className="mt-1 text-sm text-stone-700">{run.search.product} · {run.search.market} · {run.search.role}</p>
            <p role="status" className="mt-3 font-medium">
              {liveRunning ? liveEnabled ? 'Recherche en cours…' : 'Recherche en attente de la clé Brave Search.'
                : run.tasks?.filter(task => task.kind === 'search').every(task => task.state === 'failed')
                  ? 'Recherche échouée · Le moteur n’a renvoyé aucun résultat.'
                  : run.tasks?.some(task => task.state === 'failed') ? 'Recherche partielle · Certaines sources ont échoué.'
                  : 'Recherche terminée.'} · {leads.length} candidat(s)
            </p>
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

        {run && run.mode !== 'live' && (
          <section aria-labelledby="run-heading" className="mt-7 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 id="run-heading" className="text-xl font-semibold">Progression de la session</h2>
            <p className="mt-1 text-sm text-stone-700">
              {run.search.product} · {run.search.market} · {run.search.role}
            </p>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
              {steps.map((step, index) => {
                const failed = index === 2 && stage > index && run.scenario === 'partial'
                const state = failed ? 'Une source indisponible' : stage > index ? 'Terminé' : stage === index ? 'En cours' : 'En attente'
                return (
                  <li key={step} className="rounded-lg bg-paper px-4 py-3">
                    <p className="font-medium">{step}</p>
                    <p className={`mt-1 text-sm ${failed ? 'text-rose-800' : 'text-stone-700'}`}>{state}</p>
                  </li>
                )
              })}
            </ol>
            <p role="status" className="mt-4 text-sm font-medium">
              {running ? 'Session simulée en cours.' : run.scenario === 'partial'
                ? 'Session partielle. Le registre régional simulé n’a pas répondu à temps. Les résultats déjà collectés restent consultables.'
                : 'Session terminée.'}
            </p>
          </section>
        )}

        {activeLead && run && (
          <section aria-labelledby="results-heading" className="mt-7">
            <h2 id="results-heading" className="mb-4 text-xl font-semibold">{run.mode === 'live' ? 'Candidats web' : 'Résultats simulés'} ({leads.length})</h2>
            <div className="grid items-start gap-4 md:grid-cols-[1fr_2fr]">
              <ul aria-label="Prospects" className="space-y-2">
                {leads.map((lead) => {
                  const review = run.reviews[lead.id]
                  return <li key={lead.id}>
                    <button type="button" aria-pressed={activeLead.id === lead.id} onClick={() => setSelected(lead.id)}
                      className="w-full rounded-xl border border-stone-200 bg-white p-4 text-left hover:border-forest aria-pressed:border-forest aria-pressed:bg-emerald-50">
                      <span className="block font-semibold">{lead.name}</span>
                      <span className="mt-1 block text-sm text-stone-700">{statusLabels[lead.status].label}</span>
                      <span className="mt-1 block text-sm font-medium">
                        {review ? decisions[review.decision] : 'À examiner'}
                      </span>
                    </button>
                  </li>
                })}
              </ul>
              <LeadDetail key={`${run.id}/${activeLead.id}`} lead={activeLead} review={run.reviews[activeLead.id]} sources={sources}
                onAttach={running ? undefined : async input => updateSession(await attachEvidence(run.id, activeLead.id, input))}
                onSave={running ? undefined : async (decision, reason) => updateSession(await saveReview(run.id, activeLead.id, decision, reason))} />
            </div>
          </section>
        )}
        <section aria-labelledby="shortlist-heading" className="mt-7 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="shortlist-heading" className="text-xl font-semibold">Liste prioritaire ({shortlist.length})</h2>
            {shortlist.length > 0 && (
              <a href="/api/shortlist/export.xlsx" download className="rounded-lg bg-forest px-4 py-2 font-semibold text-white">
                Exporter Excel
              </a>
            )}
          </div>
          {shortlist.length === 0 ? (
            <p className="mt-2 text-stone-700">Les prospects approuvés apparaîtront ici.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-200">
              {shortlist.map(({ session, lead }) => (
                <li key={`${session.id}/${lead.id}`} className="py-3">
                  <button type="button" disabled={running || starting} onClick={() => {
                    openSession(session, lead.id)
                    requestAnimationFrame(() => {
                      const heading = document.getElementById('lead-name')
                      heading?.focus({ preventScroll: true })
                      heading?.scrollIntoView({ block: 'center' })
                    })
                  }} className="text-left font-semibold text-forest enabled:underline disabled:opacity-60">
                    {lead.name}
                  </button>
                  <p className="text-sm text-stone-700">{session.search.product} · {session.search.market} · {session.mode === 'live' ? 'Web' : 'Démo'} · {dateTime.format(new Date(session.createdAt))}</p>
                  <FollowUpForm followUp={session.followUps[lead.id]}
                    onSave={async input => updateSession(await saveFollowUp(session.id, lead.id, input))} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <Resources sources={sources} fixtures={fixtureSources} onAdd={async input => {
          const source = await createSource(input)
          setSources(previous => [...previous, source].sort((first, second) => first.name.localeCompare(second.name, 'fr')))
        }} />
        {configuration.version && (
          <footer className="mt-7 space-y-1 break-words text-sm text-stone-700">
            <p>HA Prospection · Version {configuration.version}</p>
            {configuration.logPath && <p>Journal local · {configuration.logPath}</p>}
          </footer>
        )}
      </main>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
