import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json({ abonnement: null, bassinsCount: 0, usersCount: 0 })

  const abonnement = await prisma.abonnement.findUnique({ where: { etablissementId: session.etablissementId } }).catch(() => null)

  const [bassinsCount, usersCount] = await Promise.all([
    prisma.bassin.count({ where: { etablissementId: session.etablissementId } }).catch(() => 0),
    prisma.user.count({ where: { etablissementId: session.etablissementId } }).catch(() => 0),
  ])

  return NextResponse.json({ abonnement, bassinsCount, usersCount })
}
