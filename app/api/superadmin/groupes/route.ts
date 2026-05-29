import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const groupes = await prisma.groupe.findMany({
    include: {
      organismes: {
        include: {
          etablissements: { select: { id: true, nom: true } },
        },
      },
      users: { where: { role: 'responsable_groupe' }, select: { id: true, username: true, nom: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(groupes)
}

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const body = await req.json()
  const { nom, username, password, nomContact, email = '' } = body

  if (!nom) return NextResponse.json({ error: 'Nom du groupe requis' }, { status: 400 })

  const groupe = await prisma.$transaction(async (tx) => {
    const g = await tx.groupe.create({ data: { nom } })

    // Créer le compte responsable_groupe si demandé
    if (username && password) {
      const existing = await tx.user.findUnique({ where: { username } })
      if (existing) throw new Error('USERNAME_TAKEN')
      const hashedPw = await hashPassword(password)
      await tx.user.create({
        data: {
          username,
          password: hashedPw,
          role: 'responsable_groupe',
          nom: nomContact || username,
          email,
          etablissementId: null,
          groupeId: g.id,
        },
      })
    }

    return g
  }).catch(e => { throw e })

  return NextResponse.json(groupe, { status: 201 })
}
