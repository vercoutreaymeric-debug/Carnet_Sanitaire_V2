import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'
export const dynamic = 'force-dynamic'

// POST — vérifie que le mot de passe fourni correspond bien à l'utilisateur connecté
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { password } = await req.json()
  if (!password) return NextResponse.json({ valid: false }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { username: session.username } })
  if (!user) return NextResponse.json({ valid: false }, { status: 404 })

  const valid = await verifyPassword(password, user.password)
  return NextResponse.json({ valid })
}
