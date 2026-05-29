import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json({ error: 'Aucun établissement' }, { status: 403 })

  const etabId = session.etablissementId
  try {
    const [etablissement, bassins, releves, frequentations, interventions, contacts, traitements] = await Promise.all([
      prisma.etablissement.findUnique({ where: { id: etabId } }),
      prisma.bassin.findMany({ where: { etablissementId: etabId }, orderBy: { createdAt: 'asc' } }),
      prisma.releve.findMany({ where: { etablissementId: etabId }, orderBy: [{ date: 'desc' }] }),
      prisma.frequentation.findMany({ where: { etablissementId: etabId }, orderBy: { date: 'desc' } }),
      prisma.intervention.findMany({ where: { etablissementId: etabId }, orderBy: { date: 'desc' } }),
      prisma.contact.findMany({ where: { etablissementId: etabId }, orderBy: { id: 'asc' } }),
      prisma.traitement.findMany({ where: { etablissementId: etabId }, orderBy: { date: 'desc' } }),
    ])

    const backup = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      etablissement, bassins, releves, frequentations, interventions, contacts, traitements,
    }

    const date = new Date().toISOString().slice(0, 10)
    const nom = etablissement?.nom?.replace(/[^a-z0-9]/gi, '_') ?? 'etablissement'
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${nom}-${date}.json"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
