import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const id = parseInt(params.id)
  const body = await req.json()
  const { nom } = body

  const data: Record<string, unknown> = {}
  if (nom) data.nom = nom

  const groupe = await prisma.groupe.update({ where: { id }, data })
  return NextResponse.json(groupe)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const id = parseInt(params.id)
  // Détacher les organismes avant suppression
  await prisma.organisme.updateMany({ where: { groupeId: id }, data: { groupeId: null } })
  await prisma.groupe.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
