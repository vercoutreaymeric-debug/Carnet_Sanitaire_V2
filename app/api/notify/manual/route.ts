import { NextRequest, NextResponse } from 'next/server'
import { parseSessionToken } from '@/lib/password'
import { prisma } from '@/lib/prisma'
import { sendEmail, templateReleveManquant } from '@/lib/mailer'
export const dynamic = 'force-dynamic'

/**
 * POST /api/notify/manual
 * Déclenchement manuel des notifications — réservé au superadmin.
 * Protégé par session, pas par secret (usage interne uniquement).
 */
export async function POST(req: NextRequest) {
  // ── Auth : superadmin uniquement ───────────────────────────────────────────
  const token = req.cookies.get('cs_session')?.value
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const session = parseSessionToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const me = await prisma.user.findUnique({ where: { username: session.username }, select: { role: true } })
  if (me?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Réservé au superadmin' }, { status: 403 })
  }

  // ── Même logique que le cron ────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)

  const count = await prisma.releve.count({ where: { date: today } })

  if (count > 0) {
    return NextResponse.json({
      sent: false,
      reason: `${count} relevé(s) déjà saisi(s) pour le ${today} — aucun email nécessaire`,
    })
  }

  const [users, etab] = await Promise.all([
    prisma.user.findMany({
      where: {
        email: { not: '' },
        role: { in: ['responsable_organisme', 'responsable_etablissement', 'responsable_saisie'] },
      },
      select: { email: true },
    }),
    prisma.etablissement.findFirst(),
  ])

  const recipients = users.map(u => u.email).filter(Boolean)

  if (recipients.length === 0) {
    return NextResponse.json({
      sent: false,
      reason: 'Aucun utilisateur avec un email renseigné (vérifiez les profils utilisateurs)',
    })
  }

  const etabNom = etab?.nom ?? 'votre établissement'
  const appUrl  = process.env.APP_URL ?? 'http://localhost:3000'
  const dateDisplay = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const results = await Promise.allSettled(
    recipients.map(email =>
      sendEmail({
        to: email,
        subject: `⚠️ Relevé manquant — ${etabNom} — ${dateDisplay}`,
        html: templateReleveManquant(dateDisplay, etabNom, appUrl),
      })
    )
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  await prisma.auditLog.create({
    data: {
      action: 'NOTIFY',
      module: 'releve',
      detail: `Test manuel — ${today} → ${sent} email(s) envoyé(s), ${failed} échec(s)`,
    },
  })

  return NextResponse.json({ sent: true, emails: sent, failed, recipients })
}
