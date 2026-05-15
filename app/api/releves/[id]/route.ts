import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { logAction } from '@/lib/audit'

function getRole(): string | null {
  try {
    const session = cookies().get('session')?.value
    if (!session) return null
    return JSON.parse(Buffer.from(session, 'base64').toString()).role ?? null
  } catch { return null }
}

// Validation d'un relevé (PATCH)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const role = getRole()
  const body = await req.json()

  if (!['superadmin', 'admin', 'responsable_etablissement'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Vérifier que le relevé n'est pas déjà validé
  const existing = await prisma.releve.findUnique({ where: { id: parseInt(params.id) } })
  if (!existing) return NextResponse.json({ error: 'Relevé introuvable' }, { status: 404 })
  if (existing.valide) return NextResponse.json({ error: 'Ce relevé est déjà validé et ne peut plus être modifié' }, { status: 409 })

  const releve = await prisma.releve.update({
    where: { id: parseInt(params.id) },
    data: {
      valide: true,
      valideePar: body.valideePar ?? 'Gestionnaire',
      valideeAt: new Date(),
    },
  })

  await logAction('UPDATE', 'releve', `Relevé #${releve.id} validé par ${releve.valideePar} — ${releve.bassinNom} ${releve.date}`)
  return NextResponse.json(releve)
}

// Suppression relevé — superadmin uniquement
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const role = getRole()
  if (role !== 'superadmin') {
    return NextResponse.json({ error: 'Suppression réservée au superadmin' }, { status: 403 })
  }
  await prisma.releve.delete({ where: { id: parseInt(params.id) } })
  await logAction('DELETE', 'releve', `Relevé #${params.id} supprimé`)
  return new NextResponse(null, { status: 204 })
}
