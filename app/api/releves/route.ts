import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { computeStatus } from '@/lib/utils'
import { logAction } from '@/lib/audit'
import { envoyerAlerteReleve } from '@/lib/email'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const bassinId = searchParams.get('bassinId')

  const where: Record<string, unknown> = {}
  if (date) where.date = date
  if (bassinId) where.bassinId = parseInt(bassinId)

  const releves = await prisma.releve.findMany({
    where,
    orderBy: [{ date: 'desc' }, { heure: 'desc' }],
  })
  return NextResponse.json(releves)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const status = computeStatus(
    parseFloat(body.ph),
    parseFloat(body.chloreLibre),
    parseFloat(body.chloreCombine ?? 0)
  )
  const releve = await prisma.releve.create({
    data: {
      date: body.date,
      bassinId: parseInt(body.bassinId),
      bassinNom: body.bassinNom,
      heure: body.heure,
      transparence: body.transparence ?? 'Bonne',
      tempEau: parseFloat(body.tempEau),
      tempAir: body.tempAir ? parseFloat(body.tempAir) : null,
      ph: parseFloat(body.ph),
      chloreLibre: parseFloat(body.chloreLibre),
      chloreCombine: body.chloreCombine ? parseFloat(body.chloreCombine) : null,
      chloreTotal: body.chloreTotal ? parseFloat(body.chloreTotal) : null,
      turbidite:    body.turbidite    ? parseFloat(body.turbidite)    : null,
      redox:        body.redox        ? parseFloat(body.redox)        : null,
      cyanurate:    body.cyanurate    ? parseFloat(body.cyanurate)    : null,
      tauxChlorure: body.tauxChlorure ? parseFloat(body.tauxChlorure) : null,
      th: body.th ? parseFloat(body.th) : null,
      tac: body.tac ? parseFloat(body.tac) : null,
      volumeReactif: body.volumeReactif ? parseFloat(body.volumeReactif) : null,
      debitRecyclage: body.debitRecyclage ? parseFloat(body.debitRecyclage) : null,
      status,
    },
  })
  await logAction('CREATE', 'releve', `Relevé ${releve.bassinNom} — ${releve.date} ${releve.heure} — pH ${releve.ph} Cl ${releve.chloreLibre}`)

  // Alerte email si attention ou non conforme
  if (status === 'attention' || status === 'nonconforme') {
    try {
      const [etablissement, admins] = await Promise.all([
        prisma.etablissement.findUnique({ where: { id: 1 } }),
        prisma.user.findMany({ where: { role: { in: ['superadmin', 'admin', 'responsable_etablissement'] }, email: { not: '' } } }),
      ])
      const destinataires = admins.map(u => u.email).filter(Boolean)
      if (destinataires.length > 0) {
        const valeurs = [
          { parametre: 'pH', valeur: String(releve.ph), norme: '7.1 – 7.6', ok: releve.ph >= 7.1 && releve.ph <= 7.6 },
          { parametre: 'Chlore libre', valeur: `${releve.chloreLibre} mg/L`, norme: '0.4 – 1.4 mg/L', ok: releve.chloreLibre >= 0.4 && releve.chloreLibre <= 1.4 },
          ...(releve.chloreCombine != null ? [{ parametre: 'Chlore combiné', valeur: `${releve.chloreCombine} mg/L`, norme: '< 0.6 mg/L', ok: releve.chloreCombine < 0.6 }] : []),
          ...(releve.turbidite != null ? [{ parametre: 'Turbidité', valeur: `${releve.turbidite} NTU`, norme: '≤ 0.5 NTU', ok: releve.turbidite <= 0.5 }] : []),
          ...(releve.redox != null ? [{ parametre: 'Redox', valeur: `${releve.redox} mV`, norme: '≥ 650 mV', ok: releve.redox >= 650 }] : []),
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
    } catch (e) {
      console.error('[alerte] Erreur email:', e)
    }
  }

  return NextResponse.json(releve, { status: 201 })
}
