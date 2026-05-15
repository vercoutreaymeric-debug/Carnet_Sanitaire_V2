import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const contact = await prisma.contact.update({
    where: { id: parseInt(params.id) },
    data: {
      categorie: body.categorie,
      nom: body.nom,
      adresse: body.adresse || null,
      responsable: body.responsable || null,
      bureau: body.bureau || null,
      domicile: body.domicile || null,
    },
  })
  return NextResponse.json(contact)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.contact.delete({ where: { id: parseInt(params.id) } })
  return new NextResponse(null, { status: 204 })
}
