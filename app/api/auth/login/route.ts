import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, makeSessionToken } from '@/lib/password'

async function seedUsers() {
  const count = await prisma.user.count()
  if (count > 0) return

  await prisma.user.createMany({
    data: [
      {
        username: process.env.SUPERADMIN_USERNAME || 'superadmin',
        password: hashPassword(process.env.SUPERADMIN_PASSWORD || 'cifec_super'),
        role: 'superadmin',
        nom: 'CIFEC Support',
      },
      {
        username: process.env.AUTH_USERNAME || 'admin',
        password: hashPassword(process.env.AUTH_PASSWORD || 'cifec2024'),
        role: 'admin',
        nom: 'Administrateur',
      },
    ],
  })
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    await seedUsers()

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    const token = makeSessionToken(user.username, user.role)
    const res = NextResponse.json({ ok: true, role: user.role, nom: user.nom })
    res.cookies.set('cs_session', token, {
      httpOnly: true, sameSite: 'lax', path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
