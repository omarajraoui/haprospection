import { useState } from 'react'
import { OpportunityView } from './corridor-view'
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
  const [view, setView] = useState<'suppliers' | 'demand'>('suppliers')
  return (
    <div className="space-y-6">
      <section className="market-hero" aria-labelledby="start-title">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-emerald-200">Marché international · Agroalimentaire B2B</p>
          <h1 id="start-title" className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Trouvez votre prochain partenaire commercial
          </h1>
          <p className="mt-4 text-emerald-50">Explorez les gammes des fournisseurs ou consultez les appels d’offres en cours.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="start-action" onClick={() => onSearch()}>Chercher une entreprise</button>
          <button type="button" className="rounded-lg border border-emerald-100/50 px-4 py-3 font-semibold hover:bg-white/10"
            onClick={onCompare}>Marché Maroc → France</button>
        </div>
      </section>

      <nav aria-label="Explorer le marché" className="market-switch">
        <button type="button" aria-pressed={view === 'suppliers'} onClick={() => setView('suppliers')}>
          <span>Fournisseurs et importateurs</span>
          <small>Produits et sites d’entreprise</small>
        </button>
        <button type="button" aria-pressed={view === 'demand'} onClick={() => setView('demand')}>
          <span>Demandes d’achat</span>
          <small>Appels d’offres publics</small>
        </button>
      </nav>
      <div hidden={view !== 'suppliers'}><WorldMarket onSearch={onSearch} /></div>
      {view === 'demand' && <div className="space-y-4">
        <OpportunityView international />
        <section className="surface p-4">
          <h2 className="font-semibold">Marchés publics hors de TED</h2>
          <p className="my-1 text-sm text-slate-700">Filtrez les consultations des organismes des Nations Unies par pays bénéficiaire et type de produit.</p>
          <a className="text-sm font-semibold text-forest underline" href="https://www.ungm.org/Public/notice" target="_blank" rel="noreferrer">Ouvrir UNGM</a>
        </section>
      </div>}
      <section aria-labelledby="market-sources" className="surface p-5">
        <h2 id="market-sources" className="font-semibold">Vérifier un marché ou une entreprise</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div><a className="font-semibold text-forest underline" href="https://comtrade.un.org/en/" target="_blank" rel="noreferrer">UN Comtrade</a><p className="text-sm text-slate-700">Comparer les flux d’importation par produit et pays.</p></div>
          <div><a className="font-semibold text-forest underline" href="https://annuaire-entreprises.data.gouv.fr/" target="_blank" rel="noreferrer">Annuaire des entreprises</a><p className="text-sm text-slate-700">Contrôler l’identité légale d’une entreprise française.</p></div>
          <div><a className="font-semibold text-forest underline" href="https://trade.ec.europa.eu/access-to-markets/en/my-trade-assistant" target="_blank" rel="noreferrer">Access2Markets</a><p className="text-sm text-slate-700">Consulter les droits et formalités liés au produit et à sa destination.</p></div>
        </div>
        {candidateCount > 0 && <button type="button" className="secondary-button mt-4" onClick={onFirstBuyer}>Examiner une fiche acheteur</button>}
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
