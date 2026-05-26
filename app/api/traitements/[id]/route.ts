import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const traitement = await prisma.traitement.update({
    where: { id: parseInt(params.id) },
    data: {
      date: body.date,
      heure: body.heure || null,
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
  return NextResponse.json(traitement)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const t = await prisma.traitement.findUnique({ where: { id: parseInt(params.id) } })
  await prisma.traitement.delete({ where: { id: parseInt(params.id) } })
  await logAction('DELETE', 'traitement', `${t?.bassinNom} — ${t?.date}`)
  return new NextResponse(null, { status: 204 })
}
