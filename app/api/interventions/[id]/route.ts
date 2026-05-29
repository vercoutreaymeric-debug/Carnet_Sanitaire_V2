import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const body = await req.json()
  const result = await prisma.intervention.updateMany({
    where: { id: parseInt(params.id), etablissementId: session.etablissementId },
    data: { status: body.status },
  })
  if (result.count === 0) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  const updated = await prisma.intervention.findUnique({ where: { id: parseInt(params.id) } })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  await prisma.intervention.deleteMany({ where: { id: parseInt(params.id), etablissementId: session.etablissementId } })
  return new NextResponse(null, { status: 204 })
}
