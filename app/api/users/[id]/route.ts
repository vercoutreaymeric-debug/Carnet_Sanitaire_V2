import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'
export const dynamic = 'force-dynamic'

const CAN_MANAGE = ['superadmin', 'responsable_organisme', 'responsable_groupe', 'responsable_etablissement']
const ALLOWED_ROLES: Record<string, string[]> = {
  superadmin:                ['responsable_groupe', 'responsable_organisme', 'responsable_etablissement', 'responsable_saisie', 'visualisateur', 'controleur_ars'],
  responsable_groupe:        ['responsable_organisme', 'responsable_etablissement', 'responsable_saisie', 'visualisateur', 'controleur_ars'],
  responsable_organisme:     ['responsable_etablissement', 'responsable_saisie', 'visualisateur', 'controleur_ars'],
  responsable_etablissement: ['responsable_saisie', 'visualisateur'],
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const target = await prisma.user.findUnique({ where: { id: parseInt(params.id) } })
  if (!target) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  // Vérifier appartenance (sauf superadmin)
  if (session.role !== 'superadmin' && target.etablissementId !== session.etablissementId) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
  }

  const body = await req.json()
  if (body.role) {
    const allowed = ALLOWED_ROLES[session.role] ?? []
    if (!allowed.includes(body.role)) return NextResponse.json({ error: 'Rôle non autorisé' }, { status: 403 })
  }

  const data: Record<string, unknown> = {}
  if (body.nom !== undefined)   data.nom   = body.nom
  if (body.email !== undefined) data.email = body.email
  if (body.role)                data.role  = body.role
  if (body.password)            data.password = await hashPassword(body.password)

  const user = await prisma.user.update({ where: { id: parseInt(params.id) }, data, select: { id: true, username: true, role: true, nom: true, email: true } })
  await logAction('UPDATE', 'user', `Utilisateur modifié : ${user.username} (${user.role})`, session.etablissementId)
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const user = await prisma.user.findUnique({ where: { id: parseInt(params.id) } })
  if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  if (session.role !== 'superadmin' && user.etablissementId !== session.etablissementId) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
  }
  if (user.username === session.username) return NextResponse.json({ error: 'Impossible de supprimer son propre compte' }, { status: 400 })

  await prisma.user.delete({ where: { id: parseInt(params.id) } })
  await logAction('DELETE', 'user', `Utilisateur supprimé : ${user.username}`, session.etablissementId)
  return NextResponse.json({ ok: true })
}
