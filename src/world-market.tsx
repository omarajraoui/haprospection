import { useState } from 'react'
import { searchable } from './lead-filters'
import { inputClass } from './resources'

const selection = [
  { company: 'Valio', product: 'Lait entier en poudre', category: 'Produits laitiers', country: 'Finlande', origin: 'Finlande', detail: 'Lait entier en poudre pour l’industrie alimentaire. La fiche indique un conditionnement de 25 kg.', url: 'https://www.valio.com/products/valio-whole-milk-powder/' },
  { company: 'AGRANA Fruit', product: 'Préparations de fruits', category: 'Fruits et légumes', country: 'Autriche', detail: 'Préparations à base de baies, d’agrumes et de fruits exotiques, avec ou sans morceaux.', url: 'https://www.agrana.com/en/products/all-productportfolios/fruit-juice/agrana-fruit' },
  { company: 'AUSTRIA JUICE', product: 'Concentrés de jus de fruits', category: 'Boissons', country: 'Autriche', detail: 'Concentrés de jus, notamment de pomme et de baies, pour les professionnels des boissons.', url: 'https://reports.agrana.com/en/business-areas-segments-key-topics/food-beverage-solutions-segment' },
  { company: 'ofi', product: 'Noix de cajou', category: 'Fruits secs et noix', country: 'Vietnam', detail: 'Le fournisseur déclare transformer des noix de cajou au Vietnam. La gamme comprend des noix entières et des ingrédients.', url: 'https://www.ofi.com/vi-vn/nuts/cashews' },
  { company: 'AGT Foods', product: 'Farines et protéines de légumineuses', category: 'Ingrédients', country: 'Canada', detail: 'Farines, protéines et fibres de légumineuses. Le fabricant indique une unité à Regina, au Canada.', url: 'https://www.agtfoods.com/ingredients' },
  { company: 'Yuly Food', product: 'Conserves de la mer', category: 'Produits de la mer', country: 'France', detail: 'Grossiste. Le catalogue présente notamment des filets de maquereaux en boîte de 125 g.', url: 'https://epicerie.yulyfood.com/collections/sardines-et-divers-mer' },
  { company: 'MDM Pelagic', product: 'Sardines et maquereaux', category: 'Produits de la mer', country: 'Maroc', detail: 'Conserves de poisson, entières ou en filets selon la gamme.', url: 'https://mdm-pelagic.com/produits/' },
  { company: 'PhilaFrance', product: 'Tomates', category: 'Fruits et légumes', country: 'France', origin: 'Maroc', detail: 'Importateur et exportateur de tomates du Maroc vers l’Europe.', url: 'https://www.groupe-anima.com/nos-entreprises/philafrance/' },
  { company: 'Boudjebel VACPA', product: 'Dattes Deglet Nour', category: 'Fruits et légumes', country: 'Tunisie', detail: 'Exportateur de dattes et fournisseur d’ingrédients à base de dattes.', url: 'https://www.boudjebeldates.com/' },
  { company: 'Acesur', product: 'Huile d’olive', category: 'Huiles', country: 'Espagne', detail: 'Conditionneur et exportateur d’huile d’olive.', url: 'https://acesur.com/en/international/' },
  { company: 'C.P. Intertrade', product: 'Riz jasmin', category: 'Céréales', country: 'Thaïlande', detail: 'Catalogue de riz thaïlandais avec options de conditionnement.', url: 'https://cpthairice.cpcrts.com/our-product/' },
  { company: 'ofi', product: 'Café vert', category: 'Café et cacao', country: 'Brésil', origin: 'Brésil', detail: 'Approvisionnement, transformation et exportation de café vert au Brésil.', url: 'https://www.ofi.com/pt-br/coffee/green-coffee/central-and-south-america' },
]
const categories = [...new Set(selection.map(item => item.category))].sort((a, b) => a.localeCompare(b, 'fr'))
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
        <h2 id="world-heading" tabIndex={-1} className="text-2xl font-semibold">Produits au catalogue</h2>
        <p className="mt-1 text-sm text-slate-700">Gammes publiées par les entreprises. Demandez le prix, les quantités et les conditions de livraison pour votre commande.</p>
      </div>
      <div role="group" aria-label="Catégories de produits" className="flex flex-wrap gap-2">
        <button type="button" className="filter-pill" aria-pressed={!category} onClick={() => setCategory('')}>Toutes les catégories</button>
        {categories.map(item => <button key={item} type="button" className="filter-pill"
          aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      <div className="surface grid gap-3 p-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">Produit ou entreprise
          <input className={inputClass} type="search" value={query} placeholder="Ex. lait en poudre, cajou, tomates"
            onChange={event => setQuery(event.target.value)} />
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
        {matches.map(item => <li key={item.url} className="market-card">
          <p className="text-sm font-medium text-forest">{item.category} · {item.country}</p>
          <h3 className="mt-1 text-lg font-semibold">{item.product}</h3>
          <p className="text-sm font-medium">{item.company}</p>
          <p className="my-2 text-sm text-slate-700">{item.detail}</p>
          <a className="mt-auto text-sm font-semibold text-forest underline" href={item.url}
            target="_blank" rel="noreferrer">Ouvrir le catalogue</a>
        </li>)}
      </ul>}
      <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-slate-700">{matches.length ? 'Vous cherchez un autre produit ou un autre pays ?' : 'Aucune fiche dans la sélection pour ces critères.'}</p>
        <button type="button" className="secondary-button" onClick={() => onSearch(query.trim(), country)}>Élargir la recherche</button>
      </div>
    </section>
  )
}
