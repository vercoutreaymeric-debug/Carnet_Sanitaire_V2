import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const body = await req.json()
  const result = await prisma.traitement.updateMany({
    where: { id: parseInt(params.id), etablissementId: session.etablissementId },
    data: {
      date: body.date, heure: body.heure || null,
      quantiteStabilisant:  body.quantiteStabilisant  ? parseFloat(body.quantiteStabilisant)  : null,
      uniteStabilisant:     body.uniteStabilisant     || null,
      quantiteDesinfectant: body.quantiteDesinfectant ? parseFloat(body.quantiteDesinfectant) : null,
      uniteDesinfectant:    body.uniteDesinfectant    || null,
      quantiteCorrecteurPh: body.quantiteCorrecteurPh ? parseFloat(body.quantiteCorrecteurPh) : null,
      uniteCorrecteurPh:    body.uniteCorrecteurPh    || null,
      debitRecyclage:       body.debitRecyclage       ? parseFloat(body.debitRecyclage)       : null,
      notes: body.notes || null,
    },
  })
  if (result.count === 0) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  const updated = await prisma.traitement.findUnique({ where: { id: parseInt(params.id) } })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const t = await prisma.traitement.findFirst({ where: { id: parseInt(params.id), etablissementId: session.etablissementId } })
  if (!t) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  await prisma.traitement.delete({ where: { id: parseInt(params.id) } })
  await logAction('DELETE', 'traitement', `${t.bassinNom} — ${t.date}`, session.etablissementId)
  return new NextResponse(null, { status: 204 })
}
