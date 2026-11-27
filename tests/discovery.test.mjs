import assert from 'node:assert/strict'
import { test } from 'node:test'
import { qualifyPage, discoveryTasks, retryFailedTasks } from '../server/discovery.ts'
import { processDiscoveryTask } from '../server/discovery-task.ts'
import { applyRegistryCheck } from '../server/registry.ts'
import { approvedLeads, canApproveLead } from '../src/research.ts'

const search = { product: 'Poisson en conserve du Maroc', market: 'France', role: 'Importateurs et distributeurs' }
const url = 'https://vendor.example/catalogue'

function qualify(html, criteria = search) {
  return qualifyPage(url, html, criteria.product, criteria.role, criteria.market)
}

test('uses all product terms and supports short commodities', () => {
  assert.equal(qualify('<p>Autres conserves de légumes du Maroc</p>'), undefined)
  assert.ok(qualify('<p>Grossiste de riz blanc en France</p>', { ...search, product: 'Riz blanc' }))
  const lead = qualify('<p>Importateur de conserves de poisson en France</p>')
  assert.equal(lead.qualification.roleMention, true)
  assert.equal(lead.qualification.marketMention, true)
  assert.deepEqual(lead.qualification.origin, { requested: 'Maroc', mentioned: false })
})

test('only records published same-domain purchasing role addresses and labelled identifiers', () => {
  const lead = qualify(`
    <meta property="og:site_name" content="Maison Source">
    <p>Grossiste de conserves de poisson en France</p>
    <footer>SIRET : 636 680 415 00025
      <a href="mailto:achats@directory.example">External</a>
      <a href="mailto:person@vendor.example">Personal</a>
      <a href="mailto:achats@vendor.example">Achats</a>
    </footer>`)
  assert.equal(lead.qualification.siren, '636680415')
  assert.equal(lead.contact, 'achats@vendor.example')
  assert.ok(lead.evidence.some(item => item.field === 'Adresse publique du service achats' && item.url === url))
  assert.equal(qualify('<p>Conserves de poisson 636680415</p>').qualification.siren, undefined)
  assert.equal(qualify('<p>Conserves de poisson</p><footer>SIREN 636680415 / SIREN 452565823</footer>').qualification.siren, undefined)
})

test('does not equate a registry number with brand identity; blocks inactive units', () => {
  const html = '<meta property="og:site_name" content="Maison Source"><p>Conserves de poisson</p><footer>SIREN 636680415</footer>'
  const lead = qualify(html)
  applyRegistryCheck(lead, { siren: '636680415', name: 'Autre Marque', active: true })
  assert.equal(lead.qualification.identity, 'unverified')
  const active = qualify(html)
  applyRegistryCheck(active, { siren: '636680415', name: 'MAISON SOURCE SAS', active: true })
  assert.equal(active.qualification.identity, 'verified')
  const inactive = qualify(html)
  applyRegistryCheck(inactive, { siren: '636680415', name: 'Maison Source', active: false })
  assert.equal(canApproveLead(inactive), false)
  assert.equal(approvedLeads([{ id: 'run', leads: [inactive], reviews: { [inactive.id]: { decision: 'approved' } } }]).length, 0)
})

test('queues one registry lookup per candidate and preserves results after a failed lookup', async () => {
  const payload = { mode: 'live', search, leads: [], tasks: discoveryTasks(search) }
  let lookupAttempts = 0
  const providers = {
    search: async () => [url, 'https://www.vendor.example/second'],
    readPage: async () => '<meta property="og:site_name" content="Maison Source"><p>Importateur de conserves de poisson</p><footer>SIREN 636680415</footer>',
    registry: async () => {
      if (++lookupAttempts === 1) throw new Error('Registre indisponible')
      return { siren: '636680415', name: 'Maison Source SAS', active: true }
    },
  }
  const drain = async () => {
    for (const task of payload.tasks) {
      if (task.state === 'queued') await processDiscoveryTask(payload, task, 'controlled', providers)
    }
  }
  await drain()
  assert.equal(payload.leads.length, 1)
  assert.equal(payload.tasks.filter(task => task.kind === 'registry').length, 1)
  assert.ok(payload.tasks.some(task => task.state === 'failed'))
  assert.ok(retryFailedTasks(payload.tasks))
  payload.retried = true
  await drain()
  assert.equal(payload.leads[0].qualification.identity, 'verified')
  assert.equal(payload.leads[0].evidence.filter(item => item.field === 'Identité déclarée au registre').length, 1)
})

test('uses custom origin in discovery and reports it as unconfirmed when absent from the evidence', () => {
  const criteria = { product: 'Mangues', origin: 'Côte d’Ivoire', market: 'Belgique', role: 'Acheteurs' }
  assert.ok(discoveryTasks(criteria).every(task => task.input.includes('Mangues Belgique origine Côte d’Ivoire')))
  const check = html => qualifyPage(url, html, criteria.product, criteria.role, criteria.market, criteria.origin)
  assert.deepEqual(check('<p>Acheteur de mangues en Belgique.</p>').qualification.origin,
    { requested: 'Côte d’Ivoire', mentioned: false })
  assert.deepEqual(check('<p>Acheteur de mangues de Côte d’Ivoire en Belgique.</p>').qualification.origin,
    { requested: 'Côte d’Ivoire', mentioned: true })
})
