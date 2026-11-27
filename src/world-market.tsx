import { useState } from 'react'
import { searchable } from './lead-filters'
import { inputClass } from './resources'

const selection = [
  { company: 'MDM Pelagic', product: 'Sardines et maquereaux', category: 'Produits de la mer', country: 'Maroc', detail: 'Conserves de poisson, entières ou en filets selon la gamme.', url: 'https://mdm-pelagic.com/produits/' },
  { company: 'PhilaFrance', product: 'Tomates', category: 'Fruits et légumes', country: 'France', origin: 'Maroc', detail: 'Importateur et exportateur de tomates du Maroc vers l’Europe.', url: 'https://www.groupe-anima.com/nos-entreprises/philafrance/' },
  { company: 'Boudjebel VACPA', product: 'Dattes Deglet Nour', category: 'Fruits et légumes', country: 'Tunisie', detail: 'Exportateur de dattes et fournisseur d’ingrédients à base de dattes.', url: 'https://www.boudjebeldates.com/' },
  { company: 'Acesur', product: 'Huile d’olive', category: 'Huiles', country: 'Espagne', detail: 'Conditionneur et exportateur d’huile d’olive.', url: 'https://acesur.com/en/international/' },
  { company: 'C.P. Intertrade', product: 'Riz jasmin', category: 'Céréales', country: 'Thaïlande', detail: 'Catalogue de riz thaïlandais avec options de conditionnement.', url: 'https://cpthairice.cpcrts.com/our-product/' },
  { company: 'ofi', product: 'Café vert', category: 'Café et cacao', country: 'Brésil', origin: 'Brésil', detail: 'Approvisionnement, transformation et exportation de café vert au Brésil.', url: 'https://www.ofi.com/pt-br/coffee/green-coffee/central-and-south-america' },
]
const categories = [...new Set(selection.map(item => item.category))]
const countries = [...new Set(selection.map(item => item.country))].sort((a, b) => a.localeCompare(b, 'fr'))

export function WorldMarket({ onSearch }: { onSearch: (product: string, country: string) => void }) {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [category, setCategory] = useState('')
  const matches = selection.filter(item =>
    (!country || item.country === country) && (!category || item.category === category)
    && searchable([item.company, item.product, item.category, item.country, item.origin, item.detail].join(' ')).includes(searchable(query.trim())),
  )
  return (
    <section aria-labelledby="world-heading" className="space-y-4">
      <div>
        <h2 id="world-heading" className="text-2xl font-semibold">Explorer le marché</h2>
        <p className="mt-1 text-sm text-slate-700">Sélection de fournisseurs et d’importateurs, documentée par leurs sites. Vérifiez les conditions commerciales auprès de l’entreprise.</p>
      </div>
      <div className="surface grid gap-3 p-4 sm:grid-cols-3">
        <label className="text-sm font-semibold">Produit ou entreprise
          <input className={inputClass} type="search" value={query} placeholder="Ex. riz, café, tomates"
            onChange={event => setQuery(event.target.value)} />
        </label>
        <label className="text-sm font-semibold">Catégorie
          <select className={inputClass} value={category} onChange={event => setCategory(event.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Pays d’activité
          <select className={inputClass} value={country} onChange={event => setCountry(event.target.value)}>
            <option value="">Tous les pays couverts</option>
            {countries.map(item => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <p role="status" className="text-sm text-slate-700">{matches.length} {matches.length === 1 ? 'fiche' : 'fiches'} dans la sélection</p>
      {matches.length > 0 && <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {matches.map(item => <li key={item.company} className="surface flex flex-col items-start p-5">
          <p className="text-sm font-medium text-forest">{item.category} · {item.country}</p>
          <h3 className="mt-1 text-lg font-semibold">{item.product}</h3>
          <p className="text-sm font-medium">{item.company}</p>
          <p className="my-2 text-sm text-slate-700">{item.detail}</p>
          <a className="mt-auto text-sm font-semibold text-forest underline" href={item.url}
            target="_blank" rel="noreferrer">Consulter la source</a>
        </li>)}
      </ul>}
      <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-slate-700">{matches.length ? 'Vous cherchez un autre produit ou un autre pays ?' : 'Aucune fiche dans la sélection pour ces critères.'}</p>
        <button type="button" className="secondary-button" onClick={() => onSearch(query.trim(), country)}>Élargir la recherche</button>
      </div>
      <div className="surface p-4">
        <h3 className="font-semibold">Demandes d’achat publiques</h3>
        <p className="my-1 text-sm text-slate-700">Consultez les appels d’offres internationaux et filtrez par pays bénéficiaire sur le portail des Nations Unies.</p>
        <a className="text-sm font-semibold text-forest underline" href="https://www.ungm.org/public/notice" target="_blank" rel="noreferrer">Voir les appels d’offres sur UNGM</a>
      </div>
    </section>
  )
}
