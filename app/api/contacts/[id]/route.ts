import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const body = await req.json()
  const result = await prisma.contact.updateMany({
    where: { id: parseInt(params.id), etablissementId: session.etablissementId },
    data: { categorie: body.categorie, nom: body.nom, adresse: body.adresse || null, responsable: body.responsable || null, bureau: body.bureau || null, domicile: body.domicile || null },
  })
  if (result.count === 0) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  const updated = await prisma.contact.findUnique({ where: { id: parseInt(params.id) } })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  await prisma.contact.deleteMany({ where: { id: parseInt(params.id), etablissementId: session.etablissementId } })
  return new NextResponse(null, { status: 204 })
}
