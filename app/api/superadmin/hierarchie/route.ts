import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = getSession()
  if (!session || session.role !== 'superadmin')
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const [groupes, organismes, etablissements, users] = await Promise.all([
    prisma.groupe.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { organismes: true, users: true } },
      },
    }),

    prisma.organisme.findMany({
      orderBy: { nom: 'asc' },
      include: {
        groupe: { select: { id: true, nom: true } },
        _count: { select: { etablissements: true, users: true } },
      },
    }),

    prisma.etablissement.findMany({
      orderBy: { nom: 'asc' },
      include: {
        abonnement: true,
        organisme: {
          select: { id: true, nom: true, groupe: { select: { id: true, nom: true } } },
        },
        _count: { select: { users: true, bassins: true, releves: true } },
      },
    }),

    prisma.user.findMany({
      orderBy: { username: 'asc' },
      select: {
        id: true, username: true, nom: true, role: true, email: true, createdAt: true,
        etablissementId: true,
        etablissement: { select: { id: true, nom: true, organismeId: true, organisme: { select: { id: true, nom: true, groupeId: true, groupe: { select: { id: true, nom: true } } } } } },
        organismeId: true,
        organisme: { select: { id: true, nom: true, groupeId: true, groupe: { select: { id: true, nom: true } } } },
        groupeId: true,
        groupe: { select: { id: true, nom: true } },
      },
    }),
  ])

  return NextResponse.json({ groupes, organismes, etablissements, users })
}
