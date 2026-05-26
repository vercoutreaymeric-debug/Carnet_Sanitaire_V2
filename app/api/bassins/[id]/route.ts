import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const bassin = await prisma.bassin.update({
      where: { id: parseInt(params.id) },
      data: {
        nom: body.nom,
        type: body.type,
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
        pointsPrelevement: body.pointsPrelevement || null,
      },
    })
    return NextResponse.json(bassin)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[PATCH /api/bassins]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.bassin.delete({ where: { id: parseInt(params.id) } })
  return new NextResponse(null, { status: 204 })
}
