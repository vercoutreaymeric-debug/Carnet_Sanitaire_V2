import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
export const dynamic = 'force-dynamic'

const ALLOWED = ['superadmin', 'responsable_groupe']

// GET — liste les organismes du groupe avec leurs établissements
export async function GET() {
  const session = getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const where = session.role === 'superadmin' ? {} : { groupeId: session.groupeId }

  const organismes = await prisma.organisme.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      etablissements: {
        include: {
          abonnement: true,
          _count: { select: { users: true, bassins: true, releves: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      users: {
        where: { role: 'responsable_organisme' },
        select: { id: true, username: true, nom: true, email: true },
      },
      _count: { select: { etablissements: true } },
    },
  })
  return NextResponse.json(organismes)
}

// POST — crée un nouvel organisme rattaché au groupe + compte responsable_organisme optionnel
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const body = await req.json()
  const {
    nom, type = 'société', adresse = '', telephone = '',
    username, password, nomContact = '', email = '',
  } = body

  if (!nom) return NextResponse.json({ error: 'Nom de l\'organisme requis' }, { status: 400 })

  const groupeId = session.role === 'superadmin' ? (body.groupeId ?? null) : session.groupeId

  try {
    const organisme = await prisma.$transaction(async (tx) => {
      const o = await tx.organisme.create({
        data: { nom, type, adresse, telephone, groupeId },
      })

      if (username && password) {
        const existing = await tx.user.findUnique({ where: { username } })
        if (existing) throw new Error('USERNAME_TAKEN')
        const hashed = await hashPassword(password)
        await tx.user.create({
          data: {
            username,
            password: hashed,
            role: 'responsable_organisme',
            nom: nomContact || username,
            email,
            organismeId: o.id,
          },
        })
      }

      return tx.organisme.findUnique({
        where: { id: o.id },
        include: {
          etablissements: {
            include: { abonnement: true, _count: { select: { users: true, bassins: true, releves: true } } },
          },
          users: { where: { role: 'responsable_organisme' }, select: { id: true, username: true, nom: true } },
          _count: { select: { etablissements: true } },
        },
      })
    })

    return NextResponse.json(organisme, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'USERNAME_TAKEN') {
      return NextResponse.json({ error: 'Cet identifiant est déjà utilisé' }, { status: 409 })
    }
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
