import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const id = parseInt(params.id)
  const body = await req.json()
  const { nom, type, adresse, telephone, groupeId, etablissementIds } = body

  const data: Record<string, unknown> = {}
  if (nom !== undefined)       data.nom       = nom
  if (type !== undefined)      data.type      = type
  if (adresse !== undefined)   data.adresse   = adresse
  if (telephone !== undefined) data.telephone = telephone
  if (groupeId !== undefined)  data.groupeId  = groupeId ?? null

  const organisme = await prisma.organisme.update({ where: { id }, data })

  // Réassigner les établissements si fourni
  if (etablissementIds !== undefined) {
    await prisma.etablissement.updateMany({ where: { organismeId: id }, data: { organismeId: null } })
    if (etablissementIds.length > 0) {
      await prisma.etablissement.updateMany({
        where: { id: { in: etablissementIds } },
        data: { organismeId: id },
      })
    }
  }

  return NextResponse.json(organisme)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const id = parseInt(params.id)
  // Détacher les établissements avant suppression
  await prisma.etablissement.updateMany({ where: { organismeId: id }, data: { organismeId: null } })
  await prisma.organisme.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
