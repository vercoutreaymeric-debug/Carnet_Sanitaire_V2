import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json([])

  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type')
  const bassin = searchParams.get('bassin')

  const where: Record<string, unknown> = { etablissementId: session.etablissementId }
  if (type && type !== 'Tous')   where.type   = type
  if (bassin && bassin !== 'Tous') where.bassin = bassin

  const interventions = await prisma.intervention.findMany({ where, orderBy: [{ date: 'desc' }, { heure: 'desc' }] })
  return NextResponse.json(interventions)
}

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json()
  const intervention = await prisma.intervention.create({
    data: {
      etablissementId: session.etablissementId,
      date: body.date,
      heure: body.heure || null,
      type: body.type,
      bassin: body.bassin,
      description: body.description,
      agent: body.agent || null,
      status: 'en cours',
    },
  })
  await logAction('CREATE', 'intervention', `${intervention.type} — ${intervention.bassin} — ${intervention.date}`, session.etablissementId)
  return NextResponse.json(intervention, { status: 201 })
}
