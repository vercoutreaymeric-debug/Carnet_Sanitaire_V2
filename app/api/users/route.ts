import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { logAction } from '@/lib/audit'
export const dynamic = 'force-dynamic'

const CAN_MANAGE = ['superadmin', 'admin', 'responsable_etablissement']

// Rôles qu'on peut créer selon son propre rôle
const ALLOWED_ROLES: Record<string, string[]> = {
  superadmin:               ['admin', 'responsable_etablissement', 'responsable_saisie', 'visualisateur'],
  admin:                    ['responsable_etablissement', 'responsable_saisie', 'visualisateur'],
  responsable_etablissement: ['responsable_saisie', 'visualisateur'],
}

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-role')
  if (!role || !CAN_MANAGE.includes(role)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, username: true, role: true, nom: true, email: true, createdAt: true } })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const myRole = req.headers.get('x-role')
  if (!myRole || !CAN_MANAGE.includes(myRole)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  try {
    const body = await req.json()
    if (!body.username || !body.password || !body.role) return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    const allowed = ALLOWED_ROLES[myRole] ?? []
    if (!allowed.includes(body.role)) {
      return NextResponse.json({ error: `Vous ne pouvez pas créer un compte avec ce rôle` }, { status: 403 })
    }
    const existing = await prisma.user.findUnique({ where: { username: body.username } })
    if (existing) return NextResponse.json({ error: 'Identifiant déjà utilisé' }, { status: 409 })
    const user = await prisma.user.create({
      data: { username: body.username, password: await hashPassword(body.password), role: body.role, nom: body.nom || '', email: body.email || '' },
      select: { id: true, username: true, role: true, nom: true, email: true },
    })
    await logAction('CREATE', 'user', `Utilisateur créé : ${user.username} (${user.role})`)
    return NextResponse.json(user, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
