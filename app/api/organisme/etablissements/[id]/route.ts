import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

const ALLOWED = ['superadmin', 'responsable_groupe', 'responsable_organisme']

/** Vérifie que l'utilisateur a accès à cet établissement */
async function canAccess(session: NonNullable<ReturnType<typeof getSession>>, etabId: number): Promise<boolean> {
  if (session.role === 'superadmin') return true
  const etab = await prisma.etablissement.findUnique({
    where: { id: etabId },
    include: { organisme: true },
  })
  if (!etab) return false
  if (session.role === 'responsable_organisme') {
    if (session.organismeId) return etab.organismeId === session.organismeId
    if (session.etablissementId) return etab.id === session.etablissementId
  }
  if (session.role === 'responsable_groupe' && session.groupeId) {
    return etab.organisme?.groupeId === session.groupeId
  }
  return false
}

// PATCH — modifie nom/adresse/téléphone d'un établissement
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }
  const id = parseInt(params.id)
  if (!(await canAccess(session, id))) {
    return NextResponse.json({ error: 'Établissement introuvable ou accès refusé' }, { status: 404 })
  }

  try {
    const { nom, adresse, telephone } = await req.json()
    const etab = await prisma.etablissement.update({
      where: { id },
      data: {
        ...(nom       !== undefined && { nom }),
        ...(adresse   !== undefined && { adresse }),
        ...(telephone !== undefined && { telephone }),
      },
    })
    return NextResponse.json(etab)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE — supprime un établissement et toutes ses données (cascade manuelle)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }
  const id = parseInt(params.id)
  if (!(await canAccess(session, id))) {
    return NextResponse.json({ error: 'Établissement introuvable ou accès refusé' }, { status: 404 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.pieceJointe.deleteMany({ where: { etablissementId: id } })
      await tx.auditLog.deleteMany({ where: { etablissementId: id } })
      await tx.contact.deleteMany({ where: { etablissementId: id } })
      await tx.intervention.deleteMany({ where: { etablissementId: id } })
      await tx.frequentation.deleteMany({ where: { etablissementId: id } })
      await tx.traitement.deleteMany({ where: { etablissementId: id } })
      await tx.releve.deleteMany({ where: { etablissementId: id } })
      await tx.bassin.deleteMany({ where: { etablissementId: id } })
      await tx.user.deleteMany({ where: { etablissementId: id } })
      await tx.abonnement.deleteMany({ where: { etablissementId: id } })
      await tx.etablissement.delete({ where: { id } })
    })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('[DELETE /api/organisme/etablissements]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
