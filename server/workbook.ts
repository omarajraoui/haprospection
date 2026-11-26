import ExcelJS from 'exceljs'
import { approvedLeads, type Session } from '../src/research.ts'

export async function shortlistWorkbook(sessions: Session[]) {
  const workbook = new ExcelJS.Workbook()
  const leads = workbook.addWorksheet('Leads')
  const evidence = workbook.addWorksheet('Evidence')
  leads.addRow([
    'ID prospect', 'Entreprise', 'Produit', 'Marché', 'Type', 'Contact', 'Motif de revue',
    'Date de revue', 'Responsable', 'Date de relance', 'Mode de recherche',
  ])
  evidence.addRow(['ID prospect', 'Champ', 'Source', 'URL', 'Extrait', 'Date d’observation', 'Origine'])

  for (const { session, lead } of approvedLeads(sessions)) {
    const id = `${session.id}/${lead.id}`
    const review = session.reviews[lead.id]
    const followUp = session.followUps[lead.id]
    leads.addRow([
      id, lead.name, session.search.product, session.search.market, session.search.role, lead.contact ?? '',
      review?.reason, review?.reviewedAt, followUp?.owner, followUp?.date,
      session.mode === 'live' ? 'Recherche web' : 'Démonstration',
    ])
    for (const claim of lead.evidence) {
      evidence.addRow([
        id, claim.field, claim.source, claim.url, claim.excerpt,
        claim.observedAt, claim.manual ? 'Saisie manuelle' : claim.live ? 'Page consultée' : 'Fictive',
      ])
    }
  }

  for (const sheet of [leads, evidence]) {
    sheet.getRow(1).font = { bold: true }
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
  }
  leads.columns.forEach((column, index) => { column.width = index === 0 ? 47 : 24 })
  evidence.columns.forEach((column, index) => { column.width = [47, 24, 28, 37, 62, 23, 20][index] })
  return workbook.xlsx.writeBuffer()
}
