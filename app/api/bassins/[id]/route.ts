import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

const CAN_MANAGE = ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement', 'responsable_saisie']

/** Vérifie que l'utilisateur a accès au bassin donné */
async function canAccessBassin(session: NonNullable<ReturnType<typeof getSession>>, id: number): Promise<boolean> {
  if (session.role === 'superadmin') return true
  const bassin = await prisma.bassin.findUnique({
    where: { id },
    include: { etablissement: { include: { organisme: true } } },
  })
  if (!bassin) return false
  if (session.role === 'responsable_groupe' && session.groupeId) {
    return bassin.etablissement?.organisme?.groupeId === session.groupeId
  }
  if (session.role === 'responsable_organisme') {
    if (session.organismeId) return bassin.etablissement?.organismeId === session.organismeId
    if (session.etablissementId) return bassin.etablissementId === session.etablissementId
  }
  if (session.etablissementId) return bassin.etablissementId === session.etablissementId
  return false
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const id = parseInt(params.id)
  try {
    const body = await req.json()
    if (!(await canAccessBassin(session, id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    const bassin = await prisma.bassin.update({
      where: { id },
      data: {
        nom: body.nom, type: body.type,
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
    return NextResponse.json(bassin)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  const id = parseInt(params.id)
  if (!(await canAccessBassin(session, id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  await prisma.bassin.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
