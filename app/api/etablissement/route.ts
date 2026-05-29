import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json(null)
  const etab = await prisma.etablissement.findUnique({ where: { id: session.etablissementId } })
  return NextResponse.json(etab)
}

export async function PUT(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  const body = await req.json()
  const etab = await prisma.etablissement.update({
    where: { id: session.etablissementId },
    data: {
      nom: body.nom,
      adresse: body.adresse ?? '',
      telephone: body.telephone ?? '',
      capaciteBaigneursCouvert:  parseInt(body.capaciteBaigneursCouvert)  || 0,
      capaciteVisiteursCouvert:  parseInt(body.capaciteVisiteursCouvert)  || 0,
      capaciteBaigneursPleinAir: parseInt(body.capaciteBaigneursPleinAir) || 0,
      capaciteVisiteursPleinAir: parseInt(body.capaciteVisiteursPleinAir) || 0,
    },
  })
  return NextResponse.json(etab)
}
