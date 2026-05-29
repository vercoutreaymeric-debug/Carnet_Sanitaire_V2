import { NextRequest, NextResponse } from 'next/server'
import { parseSessionToken } from '@/lib/password'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cs_session')?.value
  if (!token) return NextResponse.json({ user: null })
  const session = parseSessionToken(token)
  if (!session) return NextResponse.json({ user: null })
  const user = await prisma.user.findUnique({
    where: { username: session.username },
    select: { username: true, role: true, nom: true, etablissementId: true },
  }).catch(() => null)
  return NextResponse.json({ user })
}
