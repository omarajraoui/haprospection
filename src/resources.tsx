import { useState, type FormEvent } from 'react'
import type { Evidence } from './fixtures'
import type { EvidenceInput, FollowUp, Source } from './research'

export const inputClass = 'mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-ink'
export const actionClass = 'rounded-lg bg-forest px-4 py-2 font-semibold text-white disabled:opacity-60'

function useSave() {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function run(action: () => Promise<void>, success: string) {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await action()
      setMessage(success)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'L’enregistrement a échoué.')
    } finally {
      setSaving(false)
    }
  }

  return { saving, message, error, run }
}

function Feedback({ error, message }: { error: string; message: string }) {
  return (
    <>
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
    </>
  )
}

export function Resources({ sources, fixtures, onAdd }: {
  sources: Source[]
  fixtures: Evidence[]
  onAdd: (source: Pick<Source, 'name' | 'url' | 'type'>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('Site d’entreprise')
  const save = useSave()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void save.run(async () => {
      await onAdd({ name, url, type })
      setName('')
      setUrl('')
    }, 'Source ajoutée au répertoire.')
  }

  return (
    <section aria-labelledby="resources-heading" className="mt-7 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 id="resources-heading" className="text-2xl font-semibold">Ressources</h2>
      <p className="mt-2 text-stone-700">Ajoutez une source ici, puis rattachez un extrait et une date d’observation depuis la fiche d’un prospect.</p>
      <form onSubmit={submit} className="mt-4 space-y-3" aria-label="Ajouter une source">
        <fieldset disabled={save.saving} className="grid items-end gap-3 md:grid-cols-4">
          <label className="text-sm font-semibold">Nom
            <input className={inputClass} required maxLength={120} value={name} onChange={event => setName(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">URL
            <input className={inputClass} type="url" required maxLength={2048} value={url} onChange={event => setUrl(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">Type
            <select className={inputClass} value={type} onChange={event => setType(event.target.value)}>
              <option>Site d’entreprise</option><option>Annuaire</option><option>Registre</option><option>Autre</option>
            </select>
          </label>
          <button type="submit" className={actionClass}>Ajouter la source</button>
        </fieldset>
        <Feedback {...save} />
      </form>
      {sources.length === 0 && fixtures.length === 0 ? (
        <p className="mt-5 text-stone-700">Aucune source dans le répertoire.</p>
      ) : (
        <ul className="mt-5 divide-y divide-stone-200">
          {sources.map(source => (
            <li key={source.id} className="py-3">
              <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-forest underline">{source.name}</a>
              <p className="break-all text-sm text-stone-700">{source.type} · Saisie manuelle · Accès non vérifié · {source.url}</p>
            </li>
          ))}
          {fixtures.map(source => (
            <li key={source.url} className="py-3">
              <p className="font-semibold">{source.source}</p>
              <p className="break-all text-sm text-stone-700">{source.live ? 'Page consultée' : 'Fictive'} · Observée le {source.observedAt} · {source.url}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function EvidenceForm({ sources, onAttach }: {
  sources: Source[]
  onAttach: (input: EvidenceInput) => Promise<void>
}) {
  const [sourceId, setSourceId] = useState('')
  const [field, setField] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [observedAt, setObservedAt] = useState('')
  const save = useSave()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void save.run(async () => {
      await onAttach({ sourceId, field, excerpt, observedAt })
      setField('')
      setExcerpt('')
    }, 'Preuve ajoutée.')
  }

  return (
    <details className="mt-4 rounded-lg border border-stone-200 p-4">
      <summary className="cursor-pointer font-semibold">Rattacher une source</summary>
      {sources.length === 0 ? (
        <p className="mt-3 text-sm text-stone-700">Ajoutez d’abord une source dans <a href="#resources-heading" className="underline">Ressources</a>.</p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <p className="text-sm text-stone-700">Une nouvelle preuve demande une nouvelle revue si le prospect était approuvé.</p>
          <fieldset disabled={save.saving} className="space-y-3">
            <label className="block text-sm font-semibold">Source
              <select required className={inputClass} value={sourceId} onChange={event => setSourceId(event.target.value)}>
                <option value="">Choisir une source</option>
                {sources.map(source => <option key={source.id} value={source.id}>{source.name} · {source.url}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">Champ concerné
              <input className={inputClass} required maxLength={120} value={field} onChange={event => setField(event.target.value)} />
            </label>
            <label className="block text-sm font-semibold">Extrait
              <textarea className={inputClass} required maxLength={2000} rows={2} value={excerpt} onChange={event => setExcerpt(event.target.value)} />
            </label>
            <label className="block text-sm font-semibold">Date d’observation
              <input className={inputClass} type="date" required value={observedAt} onChange={event => setObservedAt(event.target.value)} />
            </label>
            <button type="submit" className={actionClass}>Enregistrer la preuve</button>
          </fieldset>
          <Feedback {...save} />
        </form>
      )}
    </details>
  )
}

export function FollowUpForm({ followUp, onSave }: {
  followUp: FollowUp | undefined
  onSave: (input: FollowUp) => Promise<void>
}) {
  const [owner, setOwner] = useState(followUp?.owner ?? '')
  const [date, setDate] = useState(followUp?.date ?? '')
  const save = useSave()
  return (
    <form className="mt-3 space-y-2" aria-label="Suivi du prospect" onSubmit={event => {
      event.preventDefault()
      void save.run(() => onSave({ owner, date }), 'Suivi enregistré.')
    }}>
      <fieldset disabled={save.saving} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm font-semibold">Responsable
          <input className={inputClass} maxLength={120} value={owner} onChange={event => setOwner(event.target.value)} />
        </label>
        <label className="text-sm font-semibold">Date de relance
          <input className={inputClass} type="date" value={date} onChange={event => setDate(event.target.value)} />
        </label>
        <button type="submit" className={actionClass}>Enregistrer le suivi</button>
      </fieldset>
      <Feedback {...save} />
    </form>
  )
}
