import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const etab = await prisma.etablissement.findUnique({ where: { id: 1 } })
  return NextResponse.json(etab)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const etab = await prisma.etablissement.upsert({
    where: { id: 1 },
    update: {
      nom: body.nom,
      adresse: body.adresse ?? '',
      telephone: body.telephone ?? '',
      capaciteBaigneursCouvert: parseInt(body.capaciteBaigneursCouvert) || 0,
      capaciteVisiteursCouvert: parseInt(body.capaciteVisiteursCouvert) || 0,
      capaciteBaigneursPleinAir: parseInt(body.capaciteBaigneursPleinAir) || 0,
      capaciteVisiteursPleinAir: parseInt(body.capaciteVisiteursPleinAir) || 0,
    },
    create: {
      id: 1,
      nom: body.nom,
      adresse: body.adresse ?? '',
      telephone: body.telephone ?? '',
      capaciteBaigneursCouvert: parseInt(body.capaciteBaigneursCouvert) || 0,
      capaciteVisiteursCouvert: parseInt(body.capaciteVisiteursCouvert) || 0,
      capaciteBaigneursPleinAir: parseInt(body.capaciteBaigneursPleinAir) || 0,
      capaciteVisiteursPleinAir: parseInt(body.capaciteVisiteursPleinAir) || 0,
    },
  })
  return NextResponse.json(etab)
}
