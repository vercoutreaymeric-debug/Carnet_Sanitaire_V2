import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const organismes = await prisma.organisme.findMany({
    include: {
      groupe: { select: { id: true, nom: true } },
      etablissements: { select: { id: true, nom: true } },
      users: { where: { role: 'responsable_organisme' }, select: { id: true, username: true, nom: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(organismes)
}

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const body = await req.json()
  const { nom, type = 'société', adresse = '', telephone = '', groupeId, etablissementIds = [], username, password, nomContact, email = '' } = body

  if (!nom) return NextResponse.json({ error: 'Nom de l\'organisme requis' }, { status: 400 })

  const organisme = await prisma.$transaction(async (tx) => {
    const o = await tx.organisme.create({
      data: {
        nom,
        type,
        adresse,
        telephone,
        groupeId: groupeId ?? null,
      },
    })

    // Rattacher les établissements à cet organisme
    if (etablissementIds.length > 0) {
      await tx.etablissement.updateMany({
        where: { id: { in: etablissementIds } },
        data: { organismeId: o.id },
      })
    }

    // Créer le compte responsable_organisme si demandé
    if (username && password) {
      const existing = await tx.user.findUnique({ where: { username } })
      if (existing) throw new Error('USERNAME_TAKEN')
      const hashedPw = await hashPassword(password)
      await tx.user.create({
        data: {
          username,
          password: hashedPw,
          role: 'responsable_organisme',
          nom: nomContact || username,
          email,
          etablissementId: null,
          organismeId: o.id,
        },
      })
    }

    return o
  })

  return NextResponse.json(organisme, { status: 201 })
}
