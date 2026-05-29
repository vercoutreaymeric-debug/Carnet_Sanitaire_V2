import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json({ error: 'Aucun établissement associé' }, { status: 403 })

  const etabId = session.etablissementId
  const { searchParams } = new URL(req.url)
  const du   = searchParams.get('du')
  const au   = searchParams.get('au')
  const year = searchParams.get('year') ?? new Date().getFullYear().toString()

  const dateFilter = du && au ? { gte: du, lte: au } : { startsWith: year }

  const [etablissement, bassins, releves, traitements, frequentations, interventions, auditLogs] = await Promise.all([
    prisma.etablissement.findUnique({ where: { id: etabId } }),
    prisma.bassin.findMany({ where: { etablissementId: etabId }, orderBy: { createdAt: 'asc' } }),
    prisma.releve.findMany({ where: { etablissementId: etabId, date: dateFilter }, orderBy: [{ date: 'asc' }, { heure: 'asc' }] }),
    prisma.traitement.findMany({ where: { etablissementId: etabId, date: dateFilter }, orderBy: [{ date: 'asc' }] }),
    prisma.frequentation.findMany({ where: { etablissementId: etabId, date: dateFilter }, orderBy: { date: 'asc' } }),
    prisma.intervention.findMany({ where: { etablissementId: etabId, date: dateFilter }, orderBy: { date: 'asc' } }),
    prisma.auditLog.findMany({
      where: {
        etablissementId: etabId,
        createdAt: du && au
          ? { gte: new Date(du), lte: new Date(au + 'T23:59:59') }
          : { gte: new Date(year + '-01-01'), lte: new Date(year + '-12-31T23:59:59') },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
  ])

  return NextResponse.json({ etablissement, bassins, releves, traitements, frequentations, interventions, auditLogs })
}
