import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Rôles autorisés à gérer les bassins
const CAN_MANAGE_BASSINS = ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement', 'responsable_saisie']

/** Résout l'etablissementId effectif selon le rôle de la session + body optionnel */
async function resolveEtabId(session: NonNullable<ReturnType<typeof getSession>>, bodyEtabId?: number): Promise<number | null> {
  // Rôles avec un seul établissement → depuis la session
  if (session.role === 'responsable_etablissement' || session.role === 'responsable_saisie') {
    return session.etablissementId
  }
  // Rôles supérieurs → établissementId fourni dans le body
  if (session.role === 'superadmin') return bodyEtabId ?? null
  if (session.role === 'responsable_groupe' && session.groupeId) {
    if (!bodyEtabId) return null
    const etab = await prisma.etablissement.findFirst({
      where: { id: bodyEtabId, organisme: { groupeId: session.groupeId } },
    })
    return etab ? bodyEtabId : null
  }
  if (session.role === 'responsable_organisme' && session.organismeId) {
    if (!bodyEtabId) return null
    const etab = await prisma.etablissement.findFirst({
      where: { id: bodyEtabId, organismeId: session.organismeId },
    })
    return etab ? bodyEtabId : null
  }
  // responsable_organisme créé via register (a etablissementId mais pas organismeId)
  if (session.role === 'responsable_organisme' && session.etablissementId) {
    return session.etablissementId
  }
  return null
}

export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Filtre par établissement selon le rôle
  let where: Record<string, unknown> = {}
  if (session.role === 'superadmin') {
    // Superadmin : peut filtrer par ?etablissementId=
    const etabId = req.nextUrl.searchParams.get('etablissementId')
    if (etabId) where = { etablissementId: parseInt(etabId) }
  } else if (session.role === 'responsable_groupe' && session.groupeId) {
    where = { etablissement: { organisme: { groupeId: session.groupeId } } }
  } else if (session.role === 'responsable_organisme' && session.organismeId) {
    where = { etablissement: { organismeId: session.organismeId } }
  } else if (session.etablissementId) {
    where = { etablissementId: session.etablissementId }
  } else {
    return NextResponse.json([])
  }

  const bassins = await prisma.bassin.findMany({ where, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(bassins)
}

export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!CAN_MANAGE_BASSINS.includes(session.role)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const etabId = await resolveEtabId(session, body.etablissementId ? parseInt(body.etablissementId) : undefined)
    if (!etabId) return NextResponse.json({ error: 'Établissement non déterminé. Précisez un établissementId.' }, { status: 400 })

    const bassin = await prisma.bassin.create({
      data: {
        etablissementId: etabId,
        nom: body.nom,
        type: body.type ?? 'couvert',
        longueur:           body.longueur           ? parseFloat(body.longueur)           : null,
        largeur:            body.largeur            ? parseFloat(body.largeur)            : null,
        profMin:            body.profMin            ? parseFloat(body.profMin)            : null,
        profMax:            body.profMax            ? parseFloat(body.profMax)            : null,
        surfSuperieure:     body.surfSuperieure     ? parseFloat(body.surfSuperieure)     : null,
        surfInferieure:     body.surfInferieure     ? parseFloat(body.surfInferieure)     : null,
        volumeTotal:        body.volumeTotal        ? parseFloat(body.volumeTotal)        : null,
        debitReglementaire: body.debitReglementaire ? parseFloat(body.debitReglementaire) : null,
        debitInstallation:  body.debitInstallation  ? parseFloat(body.debitInstallation)  : null,
        traitementPrincipal: body.traitementPrincipal || null,
        typeStabilisant:     body.typeStabilisant    || null,
        typeMesure:          body.typeMesure         || null,
        typeReglementaire:   body.typeReglementaire  || null,
        mineralisationEau:   body.mineralisationEau  || null,
        pointsPrelevement:   body.pointsPrelevement  || null,
      },
    })
    return NextResponse.json(bassin, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
