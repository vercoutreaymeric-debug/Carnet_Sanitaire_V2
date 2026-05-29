import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!['superadmin', 'responsable_organisme', 'responsable_groupe', 'responsable_etablissement'].includes(session.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await req.json()
  const existing = await prisma.releve.findUnique({ where: { id: parseInt(params.id) } })
  if (!existing) return NextResponse.json({ error: 'Relevé introuvable' }, { status: 404 })
  // Vérifier que c'est bien son établissement
  if (session.role !== 'superadmin' && existing.etablissementId !== session.etablissementId) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
  }
  if (existing.valide) return NextResponse.json({ error: 'Ce relevé est déjà validé' }, { status: 409 })

  const releve = await prisma.releve.update({
    where: { id: parseInt(params.id) },
    data: { valide: true, valideePar: body.valideePar ?? 'Gestionnaire', valideeAt: new Date() },
  })
  await logAction('UPDATE', 'releve', `Relevé #${releve.id} validé par ${releve.valideePar} — ${releve.bassinNom} ${releve.date}`, session.etablissementId)
  return NextResponse.json(releve)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Suppression réservée au superadmin' }, { status: 403 })
  }
  await prisma.releve.delete({ where: { id: parseInt(params.id) } })
  await logAction('DELETE', 'releve', `Relevé #${params.id} supprimé`, session.etablissementId)
  return new NextResponse(null, { status: 204 })
}
