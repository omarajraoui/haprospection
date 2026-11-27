import { WorldMarket } from './world-market'

type Props = {
  candidateCount: number
  approvedCount: number
  onFirstBuyer: () => void
  onSearch: (product?: string, country?: string) => void
  onCompare: () => void
  onFollowUp: () => void
}

export function StartHere({ candidateCount, approvedCount, onFirstBuyer, onSearch, onCompare, onFollowUp }: Props) {
  return (
    <div className="space-y-6">
      <section className="start-hero" aria-labelledby="start-title">
        <p className="text-sm font-semibold text-emerald-100">Prospection agroalimentaire</p>
        <h1 id="start-title" className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Acheter et vendre dans l’agroalimentaire à l’international
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-emerald-50">
          Choisissez un produit et un pays, vérifiez les sources des entreprises repérées et préparez vos relances.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="start-action" onClick={() => onSearch()}>
            Chercher des entreprises
          </button>
          <button type="button" className="rounded-lg border border-emerald-100/60 px-4 py-3 font-semibold text-white hover:bg-white/10"
            onClick={onCompare}>Voir le corridor Maroc → France</button>
          {candidateCount > 0 && <button type="button" className="px-3 py-3 font-semibold text-white underline"
            onClick={onFirstBuyer}>Examiner un premier acheteur</button>}
        </div>
      </section>

      <WorldMarket onSearch={onSearch} />

      {approvedCount > 0 && (
        <section className="surface flex flex-wrap items-center justify-between gap-3 p-5" aria-label="Reprendre le suivi">
          <p className="font-medium">{approvedCount} prospect{approvedCount > 1 ? 's' : ''} dans votre liste de suivi.</p>
          <button type="button" className="secondary-button" onClick={onFollowUp}>Reprendre mon suivi</button>
        </section>
      )}
    </div>
  )
}
