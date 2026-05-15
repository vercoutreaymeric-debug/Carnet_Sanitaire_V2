import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') ?? new Date().getFullYear().toString()

    const [releves, frequentations, interventions] = await Promise.all([
      prisma.releve.findMany({ where: { date: { startsWith: year } }, orderBy: { date: 'asc' } }),
      prisma.frequentation.findMany({ where: { date: { startsWith: year } }, orderBy: { date: 'asc' } }),
      prisma.intervention.findMany({ where: { date: { startsWith: year } }, orderBy: { date: 'asc' } }),
    ])

    // Import dynamique de xlsx
    const XLSX = await import('xlsx')

    const wb = XLSX.utils.book_new()

    // Feuille Relevés
    if (releves.length) {
      const ws = XLSX.utils.json_to_sheet(releves.map(r => ({
        Date: r.date, Heure: r.heure, Bassin: r.bassinNom,
        pH: r.ph, 'Chlore libre (mg/L)': r.chloreLibre,
        'Chlore combiné (mg/L)': r.chloreCombine ?? '',
        'T° eau (°C)': r.tempEau, 'T° air (°C)': r.tempAir ?? '',
        'TH (°F)': r.th ?? '', 'TAC (°F)': r.tac ?? '',
        Transparence: r.transparence, Statut: r.status,
      })))
      XLSX.utils.book_append_sheet(wb, ws, 'Relevés')
    }

    // Feuille Fréquentation
    if (frequentations.length) {
      const ws = XLSX.utils.json_to_sheet(frequentations.map(f => ({
        Date: f.date, Scolaire: f.scolaire, Club: f.club,
        Public: f.publicCount, Total: f.total,
        'L/baigneur': f.litresParBaigneur ?? '',
      })))
      XLSX.utils.book_append_sheet(wb, ws, 'Fréquentation')
    }

    // Feuille Interventions
    if (interventions.length) {
      const ws = XLSX.utils.json_to_sheet(interventions.map(i => ({
        Date: i.date, Heure: i.heure ?? '', Type: i.type,
        Bassin: i.bassin, Description: i.description,
        Agent: i.agent ?? '', Statut: i.status,
      })))
      XLSX.utils.book_append_sheet(wb, ws, 'Interventions')
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="carnet-sanitaire-${year}.xlsx"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
