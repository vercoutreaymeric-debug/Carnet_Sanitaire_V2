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

export async function GET() {
  const session = getSession()
  if (!session || !CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  let where: Record<string, unknown> = {}
  if (session.role === 'superadmin') {
    where = {}
  } else if (session.role === 'responsable_groupe' && session.groupeId) {
    // Tous les étabs du groupe via organisme
    const etabs = await prisma.etablissement.findMany({
      where: { organisme: { groupeId: session.groupeId } },
      select: { id: true },
    })
    where = { etablissementId: { in: etabs.map(e => e.id) } }
  } else if (session.role === 'responsable_organisme' && session.organismeId) {
    const etabs = await prisma.etablissement.findMany({
      where: { organismeId: session.organismeId },
      select: { id: true },
    })
    where = { etablissementId: { in: etabs.map(e => e.id) } }
  } else {
    where = { etablissementId: session.etablissementId }
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, role: true, nom: true, email: true, createdAt: true, etablissementId: true },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session || !CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  try {
    const body = await req.json()
    if (!body.username || !body.password || !body.role) return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })

    const allowed = ALLOWED_ROLES[session.role] ?? []
    if (!allowed.includes(body.role)) return NextResponse.json({ error: 'Rôle non autorisé' }, { status: 403 })

    const existing = await prisma.user.findUnique({ where: { username: body.username } })
    if (existing) return NextResponse.json({ error: 'Identifiant déjà utilisé' }, { status: 409 })

    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: await hashPassword(body.password),
        role: body.role,
        nom: body.nom || '',
        email: body.email || '',
        etablissementId: session.etablissementId ?? null,
      },
      select: { id: true, username: true, role: true, nom: true, email: true, etablissementId: true },
    })
    await logAction('CREATE', 'user', `Utilisateur créé : ${user.username} (${user.role})`, session.etablissementId)
    return NextResponse.json(user, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
