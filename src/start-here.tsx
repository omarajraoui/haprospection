type Props = {
  candidateCount: number
  approvedCount: number
  onFirstBuyer: () => void
  onCompare: () => void
  onFollowUp: () => void
}

export function StartHere({ candidateCount, approvedCount, onFirstBuyer, onCompare, onFollowUp }: Props) {
  return (
    <div className="space-y-6">
      <section className="start-hero" aria-labelledby="start-title">
        <p className="text-sm font-semibold text-emerald-100">Première sélection · Conserves de poisson · Maroc → France</p>
        <h1 id="start-title" className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Trouvez des acheteurs pour vos produits marocains
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-emerald-50">
          Ouvrez une fiche déjà documentée, vérifiez si l’entreprise correspond à votre offre, puis préparez votre liste de contacts et de relances.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="start-action" disabled={candidateCount === 0} onClick={onFirstBuyer}>
            Examiner un premier acheteur
          </button>
          <button type="button" className="rounded-lg border border-emerald-100/60 px-4 py-3 font-semibold text-white hover:bg-white/10"
            onClick={onCompare}>Comparer les produits et les acheteurs</button>
        </div>
      </section>

      <section aria-labelledby="start-workflow">
        <h2 id="start-workflow" className="text-xl font-semibold">Comment s’en servir</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          <li className="surface p-5">
            <h3 className="font-semibold">Choisir une entreprise</h3>
            <p className="mt-2 text-slate-700">Partez de la sélection préparée ou filtrez par produit pour trouver un acheteur adapté.</p>
          </li>
          <li className="surface p-5">
            <h3 className="font-semibold">Vérifier avant de retenir</h3>
            <p className="mt-2 text-slate-700">Ouvrez les sources, regardez ce que l’acheteur commercialise et notez ce que vous devez encore confirmer.</p>
          </li>
          <li className="surface p-5">
            <h3 className="font-semibold">Planifier une relance</h3>
            <p className="mt-2 text-slate-700">Retenez la fiche, ajoutez une date de relance dans le suivi, puis exportez votre liste vers Excel si besoin.</p>
          </li>
        </ol>
      </section>

      {approvedCount > 0 && (
        <section className="surface flex flex-wrap items-center justify-between gap-3 p-5" aria-label="Reprendre le suivi">
          <p className="font-medium">{approvedCount} prospect{approvedCount > 1 ? 's' : ''} dans votre liste de suivi.</p>
          <button type="button" className="secondary-button" onClick={onFollowUp}>Reprendre mon suivi</button>
        </section>
      )}
    </div>
  )
}
