import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const contacts = await prisma.contact.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const contact = await prisma.contact.create({
    data: {
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
