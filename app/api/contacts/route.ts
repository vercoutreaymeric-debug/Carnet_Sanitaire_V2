import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json([])
  const contacts = await prisma.contact.findMany({ where: { etablissementId: session.etablissementId }, orderBy: { id: 'asc' } })
  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const body = await req.json()
  const contact = await prisma.contact.create({
    data: {
      etablissementId: session.etablissementId,
      categorie: body.categorie,
      nom: body.nom,
      adresse: body.adresse || null,
      responsable: body.responsable || null,
      bureau: body.bureau || null,
      domicile: body.domicile || null,
    },
  })
  return NextResponse.json(contact, { status: 201 })
}
