import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { logAction } from '@/lib/audit'
export const dynamic = 'force-dynamic'

const CAN_MANAGE = ['superadmin', 'admin', 'responsable_etablissement']

const ALLOWED_ROLES: Record<string, string[]> = {
  superadmin:               ['admin', 'responsable_etablissement', 'responsable_saisie', 'visualisateur'],
  admin:                    ['responsable_etablissement', 'responsable_saisie', 'visualisateur'],
  responsable_etablissement: ['responsable_saisie', 'visualisateur'],
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const myRole = req.headers.get('x-role')
  if (!myRole || !CAN_MANAGE.includes(myRole)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const body = await req.json()
  if (body.role) {
    const allowed = ALLOWED_ROLES[myRole] ?? []
    if (!allowed.includes(body.role)) {
      return NextResponse.json({ error: 'Vous ne pouvez pas attribuer ce rôle' }, { status: 403 })
    }
  }
  const data: Record<string, string> = {}
  if (body.nom !== undefined) data.nom = body.nom
  if (body.email !== undefined) data.email = body.email
  if (body.role) data.role = body.role
  if (body.password) data.password = hashPassword(body.password)
  const user = await prisma.user.update({ where: { id: parseInt(params.id) }, data, select: { id: true, username: true, role: true, nom: true, email: true } })
  await logAction('UPDATE', 'user', `Utilisateur modifié : ${user.username} (${user.role})`)
  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const myRole = req.headers.get('x-role')
  const currentUser = req.headers.get('x-user')
  if (!myRole || !CAN_MANAGE.includes(myRole)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const user = await prisma.user.findUnique({ where: { id: parseInt(params.id) } })
  if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  if (user.username === currentUser) return NextResponse.json({ error: 'Impossible de supprimer son propre compte' }, { status: 400 })
  // Vérifier qu'il reste au moins un admin
  if (user.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } })
    if (adminCount <= 1) return NextResponse.json({ error: 'Impossible de supprimer le dernier administrateur' }, { status: 400 })
  }
  await prisma.user.delete({ where: { id: parseInt(params.id) } })
  await logAction('DELETE', 'user', `Utilisateur supprimé : ${user.username}`)
  return NextResponse.json({ ok: true })
}
