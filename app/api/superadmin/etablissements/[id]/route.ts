import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

// PATCH — met à jour l'abonnement d'un établissement
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const body = await req.json()
  const id = parseInt(params.id)

  // Mettre à jour l'établissement si des champs sont fournis
  if (body.nom || body.adresse !== undefined || body.telephone !== undefined) {
    await prisma.etablissement.update({
      where: { id },
      data: {
        nom:       body.nom       ?? undefined,
        adresse:   body.adresse   ?? undefined,
        telephone: body.telephone ?? undefined,
      },
    })
  }

  // Mettre à jour l'abonnement
  const abonnement = await prisma.abonnement.update({
    where: { etablissementId: id },
    data: {
      plan:            body.plan            ?? undefined,
      statut:          body.statut          ?? undefined,
      dateDebut:       body.dateDebut       ? new Date(body.dateDebut)       : undefined,
      dateExpiration:  body.dateExpiration  ? new Date(body.dateExpiration)  : undefined,
      maxBassins:      body.maxBassins      !== undefined ? parseInt(body.maxBassins)      : undefined,
      maxUtilisateurs: body.maxUtilisateurs !== undefined ? parseInt(body.maxUtilisateurs) : undefined,
      notes:           body.notes           ?? undefined,
    },
  })
  return NextResponse.json(abonnement)
}

// DELETE — supprime un établissement et toutes ses données (cascade manuelle)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const id = parseInt(params.id)
  try {
    await prisma.$transaction(async (tx) => {
      // Supprimer dans l'ordre pour éviter les violations FK
      await tx.pieceJointe.deleteMany({ where: { etablissementId: id } })
      await tx.auditLog.deleteMany({ where: { etablissementId: id } })
      await tx.contact.deleteMany({ where: { etablissementId: id } })
      await tx.intervention.deleteMany({ where: { etablissementId: id } })
      await tx.frequentation.deleteMany({ where: { etablissementId: id } })
      // Traitement et Relevé référencent aussi bassinId
      await tx.traitement.deleteMany({ where: { etablissementId: id } })
      await tx.releve.deleteMany({ where: { etablissementId: id } })
      await tx.bassin.deleteMany({ where: { etablissementId: id } })
      await tx.user.deleteMany({ where: { etablissementId: id } })
      await tx.abonnement.deleteMany({ where: { etablissementId: id } })
      await tx.etablissement.delete({ where: { id } })
    })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('[DELETE /api/superadmin/etablissements]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
