import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activeTedNotices } from '../server/opportunities.ts'
import { sharedProducts, suppliers } from '../src/corridor-data.ts'

const today = '2026-11-27'
const notice = {
  'publication-number': '123456-2026',
  'notice-title': { eng: 'Food supplies', fra: 'Fourniture de denrées' },
  'buyer-name': { fra: ['Acheteur public'] },
  'notice-type': 'cn-standard',
  'classification-cpv': ['15241300', '15800000'],
  'organisation-country-buyer': ['FRA'],
  'deadline-receipt-tender-date-lot': ['2026-12-11+01:00'],
  'publication-date': '2026-11-25Z',
  'BT-21-Lot': { fra: ['Sardines en conserve', 'Pain'] },
}

test('suggests a relationship only for a documented product shared by both companies', () => {
  const lgmc = suppliers.find(item => item.id === 'lgmc')
  assert.deepEqual(sharedProducts(lgmc, 'siren-636680415', ''), ['Sardines'])
  assert.deepEqual(sharedProducts(lgmc, 'siren-636680415', 'Maquereaux'), [])
  assert.deepEqual(sharedProducts(lgmc, 'company-without-evidence', ''), [])
})

test('normalizes an active TED notice and keeps the original source link', () => {
  const [item] = activeTedNotices([notice, notice], today)
  assert.equal(activeTedNotices([notice, notice], today).length, 1)
  assert.equal(item.title, 'Fourniture de denrées')
  assert.deepEqual(item.codes, ['15241300'])
  assert.deepEqual(item.lotTitles, ['Sardines en conserve'])
  assert.equal(item.deadline, '2026-12-11')
  assert.equal(item.url, 'https://ted.europa.eu/fr/notice/-/detail/123456-2026')
})

test('excludes awards, stale or ambiguous deadlines, and unrelated markets or codes', () => {
  for (const override of [
    { 'notice-type': 'can-standard' },
    { 'deadline-receipt-tender-date-lot': ['2026-11-27+01:00'] },
    { 'deadline-receipt-tender-date-lot': ['2026-12-11+01:00', '2026-12-31+01:00'] },
    { 'deadline-receipt-tender-date-lot': ['2026-02-31+01:00'] },
    { 'deadline-receipt-tender-date-lot': [] },
    { 'organisation-country-buyer': ['ESP'] },
    { 'classification-cpv': ['15800000'] },
  ]) assert.deepEqual(activeTedNotices([{ ...notice, ...override }], today), [])
})
