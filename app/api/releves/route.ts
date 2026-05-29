import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { computeStatus } from '@/lib/utils'
import { logAction } from '@/lib/audit'
import { envoyerAlerteReleve } from '@/lib/email'

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json([])

  const { searchParams } = new URL(req.url)
  const date     = searchParams.get('date')
  const bassinId = searchParams.get('bassinId')

  const where: Record<string, unknown> = { etablissementId: session.etablissementId }
  if (date) where.date = date
  if (bassinId) where.bassinId = parseInt(bassinId)

  const releves = await prisma.releve.findMany({
    where,
    orderBy: [{ date: 'desc' }, { heure: 'desc' }],
  })
  return NextResponse.json(releves)
}

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json()
  const chloreCombineVal = body.chloreCombine !== '' && body.chloreCombine != null ? parseFloat(body.chloreCombine) : null
  const status = computeStatus(parseFloat(body.ph), parseFloat(body.chloreLibre), chloreCombineVal)

  const releve = await prisma.releve.create({
    data: {
      etablissementId: session.etablissementId,
      date: body.date,
      bassinId: parseInt(body.bassinId),
      bassinNom: body.bassinNom,
      heure: body.heure,
      transparence:    body.transparence    ?? 'Bonne',
      tempEau:         parseFloat(body.tempEau),
      tempAir:         body.tempAir         ? parseFloat(body.tempAir)         : null,
      ph:              parseFloat(body.ph),
      chloreLibre:     parseFloat(body.chloreLibre),
      chloreCombine:   body.chloreCombine   ? parseFloat(body.chloreCombine)   : null,
      chloreTotal:     body.chloreTotal     ? parseFloat(body.chloreTotal)     : null,
      turbidite:       body.turbidite       ? parseFloat(body.turbidite)       : null,
      redox:           body.redox           ? parseFloat(body.redox)           : null,
      cyanurate:       body.cyanurate       ? parseFloat(body.cyanurate)       : null,
      tauxChlorure:    body.tauxChlorure    ? parseFloat(body.tauxChlorure)    : null,
      pointPrelevement: body.pointPrelevement || null,
      th:              body.th              ? parseFloat(body.th)              : null,
      tac:             body.tac             ? parseFloat(body.tac)             : null,
      chloreActif:     body.chloreActif     ? parseFloat(body.chloreActif)     : null,
      volumeReactif:   body.volumeReactif   ? parseFloat(body.volumeReactif)   : null,
      debitRecyclage:  body.debitRecyclage  ? parseFloat(body.debitRecyclage)  : null,
      status,
    },
  })
  await logAction('CREATE', 'releve', `Relevé ${releve.bassinNom} — ${releve.date} ${releve.heure} — pH ${releve.ph} Cl ${releve.chloreLibre}`, session.etablissementId)

  // Alerte email si attention ou non conforme
  if (status === 'attention' || status === 'nonconforme') {
    try {
      const [etablissement, admins] = await Promise.all([
        prisma.etablissement.findUnique({ where: { id: session.etablissementId } }),
        prisma.user.findMany({ where: { etablissementId: session.etablissementId, role: { in: ['responsable_organisme', 'responsable_etablissement'] }, email: { not: '' } } }),
      ])
      const destinataires = admins.map(u => u.email).filter(Boolean)
      if (destinataires.length > 0) {
        const valeurs = [
          { parametre: 'pH', valeur: String(releve.ph), norme: '7.1 – 7.6', ok: releve.ph >= 7.1 && releve.ph <= 7.6 },
          { parametre: 'Chlore libre', valeur: `${releve.chloreLibre} mg/L`, norme: '0.4 – 1.4 mg/L', ok: releve.chloreLibre >= 0.4 && releve.chloreLibre <= 1.4 },
          ...(releve.chloreCombine != null ? [{ parametre: 'Chlore combiné', valeur: `${releve.chloreCombine} mg/L`, norme: '< 0.6 mg/L', ok: releve.chloreCombine < 0.6 }] : []),
        ]
        await envoyerAlerteReleve({
          status: status as 'attention' | 'nonconforme',
          bassinNom: releve.bassinNom,
          date: releve.date,
          heure: releve.heure,
          saisiPar: body.saisiPar || 'Technicien',
          etablissementNom: etablissement?.nom ?? 'Établissement',
          valeurs,
          destinataires,
        })
      }
    } catch (e) { console.error('[alerte] Erreur email:', e) }
  }

  return NextResponse.json(releve, { status: 201 })
}
