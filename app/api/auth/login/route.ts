import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, makeSessionToken } from '@/lib/password'

// ── Vérification hCaptcha ────────────────────────────────────────────────────
async function verifyHCaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY
  if (!secret) return true

  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip })
    const res = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

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

function clearAttempts(ip: string) { attempts.delete(ip) }

// ── Seed superadmin au premier démarrage ──────────────────────────────────────
async function seedSuperAdmin() {
  const count = await prisma.user.count()
  if (count > 0) return
  const pw = await hashPassword(process.env.SUPERADMIN_PASSWORD || 'cifec_super_2024')
  await prisma.user.create({
    data: {
      username: process.env.SUPERADMIN_USERNAME || 'superadmin',
      password: pw,
      role: 'superadmin',
      nom: 'CIFEC Support',
      etablissementId: null,
    },
  })
}

export async function POST(req: NextRequest) {
  const ip = getIP(req)

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 })
  }

  try {
    const { username, password, captchaToken } = await req.json()

    if (!captchaToken || !(await verifyHCaptcha(captchaToken, ip))) {
      return NextResponse.json({ error: 'Vérification anti-robot échouée.' }, { status: 400 })
    }

    await seedSuperAdmin()

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    // Vérifier que l'abonnement de l'établissement est actif (sauf superadmin)
    if (user.role !== 'superadmin' && user.etablissementId) {
      const abonnement = await prisma.abonnement.findUnique({
        where: { etablissementId: user.etablissementId },
      })
      if (abonnement && abonnement.statut === 'suspendu') {
        return NextResponse.json({ error: 'Votre compte est suspendu. Contactez CIFEC.' }, { status: 403 })
      }
      if (abonnement && abonnement.statut === 'expiré') {
        return NextResponse.json({ error: 'Abonnement expiré. Contactez CIFEC pour renouveler.' }, { status: 403 })
      }
    }

    // Migration SHA-256 → bcrypt
    if (!user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
      const newHash = await hashPassword(password)
      await prisma.user.update({ where: { id: user.id }, data: { password: newHash } })
    }

    clearAttempts(ip)

    const token = makeSessionToken(user.username, user.role, user.etablissementId, user.groupeId ?? null, user.organismeId ?? null)
    const res = NextResponse.json({ ok: true, role: user.role, nom: user.nom })
    res.cookies.set('cs_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
