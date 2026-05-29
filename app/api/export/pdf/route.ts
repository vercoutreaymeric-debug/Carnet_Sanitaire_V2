import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

function isAuthenticated(): boolean {
  try {
    const session = cookies().get('cs_session')?.value
    if (!session) return false
    const parts = atob(session).split('|')
    const secret = process.env.AUTH_SECRET || 'cs-secret-key'
    return parts.length >= 3 && parts[2] === secret
  } catch { return false }
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const du    = searchParams.get('du')    // YYYY-MM-DD
  const au    = searchParams.get('au')    // YYYY-MM-DD
  const year  = searchParams.get('year') ?? new Date().getFullYear().toString()

  // Filtre date dynamique
  const dateFilter = du && au
    ? { gte: du, lte: au }
    : { startsWith: year }

  const [etablissement, bassins, releves, traitements, frequentations, interventions, auditLogs] = await Promise.all([
    prisma.etablissement.findFirst(),
    prisma.bassin.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.releve.findMany({
      where: { date: dateFilter },
      orderBy: [{ date: 'asc' }, { heure: 'asc' }],
    }),
    prisma.traitement.findMany({
      where: { date: dateFilter },
      orderBy: [{ date: 'asc' }],
    }),
    prisma.frequentation.findMany({
      where: { date: dateFilter },
      orderBy: { date: 'asc' },
    }),
    prisma.intervention.findMany({
      where: { date: dateFilter },
      orderBy: { date: 'asc' },
    }),
    prisma.auditLog.findMany({
      where: {
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
