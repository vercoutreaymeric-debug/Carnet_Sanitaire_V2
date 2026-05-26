import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const bassins = await prisma.bassin.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(bassins)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const bassin = await prisma.bassin.create({
      data: {
        nom: body.nom,
        type: body.type ?? 'couvert',
        longueur: body.longueur ? parseFloat(body.longueur) : null,
        largeur: body.largeur ? parseFloat(body.largeur) : null,
        profMin: body.profMin ? parseFloat(body.profMin) : null,
        profMax: body.profMax ? parseFloat(body.profMax) : null,
        surfSuperieure: body.surfSuperieure ? parseFloat(body.surfSuperieure) : null,
        surfInferieure: body.surfInferieure ? parseFloat(body.surfInferieure) : null,
        volumeTotal: body.volumeTotal ? parseFloat(body.volumeTotal) : null,
        debitReglementaire: body.debitReglementaire ? parseFloat(body.debitReglementaire) : null,
        debitInstallation: body.debitInstallation ? parseFloat(body.debitInstallation) : null,
        traitementPrincipal: body.traitementPrincipal || null,
        typeStabilisant: body.typeStabilisant || null,
        typeMesure: body.typeMesure || null,
        typeReglementaire: body.typeReglementaire || null,
        mineralisationEau: body.mineralisationEau || null,
        pointsPrelevement: body.pointsPrelevement ? JSON.stringify(body.pointsPrelevement) : null,
      },
    })
    return NextResponse.json(bassin, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[POST /api/bassins]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
