import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, hashPasswordLegacy, verifyPassword, makeSessionToken } from '@/lib/password'

// ── Vérification Cloudflare Turnstile ───────────────────────────────────────
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // si pas configuré, on laisse passer (dev sans clé)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    })
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}

// ── Rate limiting simple en mémoire ─────────────────────────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_ATTEMPTS
}

function clearAttempts(ip: string) {
  attempts.delete(ip)
}

// ── Seed utilisateurs par défaut au premier démarrage ───────────────────────
async function seedUsers() {
  const count = await prisma.user.count()
  if (count > 0) return

  const [pwSuper, pwAdmin] = await Promise.all([
    hashPassword(process.env.SUPERADMIN_PASSWORD || 'cifec_super_2024'),
    hashPassword(process.env.AUTH_PASSWORD || 'cifec2024'),
  ])

  await prisma.user.createMany({
    data: [
      {
        username: process.env.SUPERADMIN_USERNAME || 'superadmin',
        password: pwSuper,
        role: 'superadmin',
        nom: 'CIFEC Support',
      },
      {
        username: process.env.AUTH_USERNAME || 'admin',
        password: pwAdmin,
        role: 'admin',
        nom: 'Administrateur',
      },
    ],
  })
}

export async function POST(req: NextRequest) {
  const ip = getIP(req)

  // Vérification rate limit
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
      { status: 429 }
    )
  }

  try {
    const { username, password, turnstileToken } = await req.json()

    // Vérification anti-robot Turnstile
    if (!turnstileToken || !(await verifyTurnstile(turnstileToken, ip))) {
      return NextResponse.json(
        { error: 'Vérification anti-robot échouée. Actualisez la page et réessayez.' },
        { status: 400 }
      )
    }

    await seedUsers()

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    // Migration automatique SHA-256 → bcrypt au premier login réussi
    if (!user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
      const newHash = await hashPassword(password)
      await prisma.user.update({ where: { id: user.id }, data: { password: newHash } })
    }

    clearAttempts(ip)

    const token = makeSessionToken(user.username, user.role)
    const res = NextResponse.json({ ok: true, role: user.role, nom: user.nom })
    res.cookies.set('cs_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en production
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
