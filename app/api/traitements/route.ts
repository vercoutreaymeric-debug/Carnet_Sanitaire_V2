import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bassinId = searchParams.get('bassinId')
  const date = searchParams.get('date')

  const where: Record<string, unknown> = {}
  if (bassinId) where.bassinId = parseInt(bassinId)
  if (date) where.date = date

  const traitements = await prisma.traitement.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: { bassin: { select: { nom: true } } },
  })
  return NextResponse.json(traitements)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const traitement = await prisma.traitement.create({
    data: {
      date: body.date,
      heure: body.heure || null,
      bassinId: parseInt(body.bassinId),
      bassinNom: body.bassinNom,
      quantiteStabilisant: body.quantiteStabilisant ? parseFloat(body.quantiteStabilisant) : null,
      uniteStabilisant: body.uniteStabilisant || null,
      quantiteDesinfectant: body.quantiteDesinfectant ? parseFloat(body.quantiteDesinfectant) : null,
      uniteDesinfectant: body.uniteDesinfectant || null,
      quantiteCorrecteurPh: body.quantiteCorrecteurPh ? parseFloat(body.quantiteCorrecteurPh) : null,
      uniteCorrecteurPh: body.uniteCorrecteurPh || null,
      debitRecyclage: body.debitRecyclage ? parseFloat(body.debitRecyclage) : null,
      notes: body.notes || null,
    },
  })
  await logAction('CREATE', 'traitement', `${traitement.bassinNom} — ${traitement.date}`)
  return NextResponse.json(traitement, { status: 201 })
}
