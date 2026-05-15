import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseSessionToken, verifyPassword, hashPassword, makeSessionToken } from '@/lib/password'
import { logAction } from '@/lib/audit'
export const dynamic = 'force-dynamic'

/**
 * PATCH /api/superadmin/credentials
 * Permet au superadmin de changer son propre identifiant et/ou mot de passe.
 * Requiert le mot de passe actuel pour confirmer.
 */
export async function PATCH(req: NextRequest) {
  // ── Auth : superadmin uniquement ───────────────────────────────────────────
  const token = req.cookies.get('cs_session')?.value
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const session = parseSessionToken(token)
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Réservé au superadmin' }, { status: 403 })
  }

  const body = await req.json()
  const { currentPassword, newUsername, newPassword } = body

  if (!currentPassword) {
    return NextResponse.json({ error: 'Le mot de passe actuel est requis' }, { status: 400 })
  }
  if (!newUsername && !newPassword) {
    return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 })
  }

  // ── Vérification du mot de passe actuel ────────────────────────────────────
  const user = await prisma.user.findUnique({ where: { username: session.username } })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  if (!verifyPassword(currentPassword, user.password)) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 })
  }

  // ── Vérification unicité du nouvel identifiant ─────────────────────────────
  if (newUsername && newUsername !== user.username) {
    const exists = await prisma.user.findUnique({ where: { username: newUsername } })
    if (exists) {
      return NextResponse.json({ error: 'Cet identifiant est déjà utilisé' }, { status: 409 })
    }
  }

  // ── Mise à jour ────────────────────────────────────────────────────────────
  const data: Record<string, string> = {}
  if (newUsername && newUsername !== user.username) data.username = newUsername
  if (newPassword) data.password = hashPassword(newPassword)

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { username: true, role: true },
  })

  await logAction('UPDATE', 'user', `Superadmin — identifiants modifiés (username: ${updated.username})`)

  // ── Renouvellement du cookie de session ────────────────────────────────────
  const newToken = makeSessionToken(updated.username, updated.role)
  const res = NextResponse.json({ ok: true, username: updated.username })
  res.cookies.set('cs_session', newToken, {
    httpOnly: true, sameSite: 'lax', path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
