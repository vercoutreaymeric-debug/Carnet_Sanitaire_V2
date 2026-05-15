import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [etablissement, bassins, releves, frequentations, interventions, contacts] = await Promise.all([
      prisma.etablissement.findUnique({ where: { id: 1 } }),
      prisma.bassin.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.releve.findMany({ orderBy: [{ date: 'desc' }] }),
      prisma.frequentation.findMany({ orderBy: { date: 'desc' } }),
      prisma.intervention.findMany({ orderBy: { date: 'desc' } }),
      prisma.contact.findMany({ orderBy: { id: 'asc' } }),
    ])

    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      etablissement,
      bassins,
      releves,
      frequentations,
      interventions,
      contacts,
    }

    const date = new Date().toISOString().slice(0, 10)
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-carnet-sanitaire-${date}.json"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
