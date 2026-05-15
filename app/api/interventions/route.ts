import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const bassin = searchParams.get('bassin')

  const where: Record<string, unknown> = {}
  if (type && type !== 'Tous') where.type = type
  if (bassin && bassin !== 'Tous') where.bassin = bassin

  const interventions = await prisma.intervention.findMany({
    where,
    orderBy: [{ date: 'desc' }, { heure: 'desc' }],
  })
  return NextResponse.json(interventions)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const intervention = await prisma.intervention.create({
    data: {
      date: body.date,
      heure: body.heure || null,
      type: body.type,
      bassin: body.bassin,
      description: body.description,
      agent: body.agent || null,
      status: 'en cours',
    },
  })
  await logAction('CREATE', 'intervention', `${intervention.type} — ${intervention.bassin} — ${intervention.date}`)
  return NextResponse.json(intervention, { status: 201 })
}
