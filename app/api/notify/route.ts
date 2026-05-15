import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, templateReleveManquant } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notify?secret=VOTRE_SECRET
 *
 * Vérifie si un relevé a été saisi aujourd'hui.
 * Si non → envoie un email à tous les utilisateurs ayant un email renseigné.
 *
 * À appeler via un cron job quotidien (ex: 8h du matin).
 * Protégé par un secret dans la variable d'environnement NOTIFY_SECRET.
 */
export async function GET(req: NextRequest) {
  // ── Vérification du secret ──────────────────────────────────────────────────
  const secret = req.nextUrl.searchParams.get('secret')
  const expected = process.env.NOTIFY_SECRET

  if (!expected) {
    return NextResponse.json({ error: 'NOTIFY_SECRET non configuré' }, { status: 500 })
  }
  if (secret !== expected) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // ── Date à vérifier (aujourd'hui par défaut, ou paramètre ?date=YYYY-MM-DD) ─
  const dateParam = req.nextUrl.searchParams.get('date')
  const today = dateParam ?? new Date().toISOString().slice(0, 10)

  try {
    // Compte les relevés du jour
    const count = await prisma.releve.count({ where: { date: today } })

    if (count > 0) {
      return NextResponse.json({
        sent: false,
        reason: `${count} relevé(s) déjà saisi(s) pour le ${today}`,
        date: today,
      })
    }

    // Aucun relevé → récupère les destinataires et l'établissement
    const [users, etab] = await Promise.all([
      prisma.user.findMany({
        where: {
          email: { not: '' },
          role: { in: ['admin', 'responsable_etablissement', 'responsable_saisie'] },
        },
        select: { email: true, nom: true },
      }),
      prisma.etablissement.findFirst(),
    ])

    const recipients = users.map(u => u.email).filter(Boolean)

    if (recipients.length === 0) {
      return NextResponse.json({
        sent: false,
        reason: 'Aucun utilisateur avec un email renseigné',
        date: today,
      })
    }

    const etabNom  = etab?.nom ?? 'votre établissement'
    const appUrl   = process.env.APP_URL ?? 'http://localhost:3000'
    const dateDisplay = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    // Envoie un email à chaque destinataire
    const results = await Promise.allSettled(
      recipients.map(email =>
        sendEmail({
          to: email,
          subject: `⚠️ Relevé manquant — ${etabNom} — ${dateDisplay}`,
          html: templateReleveManquant(dateDisplay, etabNom, appUrl),
        })
      )
    )

    const sent    = results.filter(r => r.status === 'fulfilled').length
    const failed  = results.filter(r => r.status === 'rejected').length

    // Log dans l'audit
    await prisma.auditLog.create({
      data: {
        action: 'NOTIFY',
        module: 'releve',
        detail: `Alerte relevé manquant (${today}) → ${sent} email(s) envoyé(s), ${failed} échec(s)`,
      },
    })

    return NextResponse.json({ sent: true, emails: sent, failed, date: today, recipients })

  } catch (err) {
    console.error('[notify]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
