import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

const ALLOWED = ['superadmin', 'responsable_groupe']

async function canAccess(session: NonNullable<ReturnType<typeof getSession>>, orgId: number) {
  if (session.role === 'superadmin') return true
  const org = await prisma.organisme.findUnique({ where: { id: orgId } })
  return org?.groupeId === session.groupeId
}

// PATCH — modifie nom/type/adresse/téléphone
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !ALLOWED.includes(session.role)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const id = parseInt(params.id)
  if (!(await canAccess(session, id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  try {
    const { nom, type, adresse, telephone } = await req.json()
    const org = await prisma.organisme.update({
      where: { id },
      data: {
        ...(nom       !== undefined && { nom }),
        ...(type      !== undefined && { type }),
        ...(adresse   !== undefined && { adresse }),
        ...(telephone !== undefined && { telephone }),
      },
    })
    return NextResponse.json(org)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE — supprime l'organisme et détache ses établissements (ou les supprime aussi)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !ALLOWED.includes(session.role)) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const id = parseInt(params.id)
  if (!(await canAccess(session, id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  try {
    await prisma.$transaction(async (tx) => {
      // Détacher les établissements (ils continuent d'exister sans organisme)
      await tx.etablissement.updateMany({ where: { organismeId: id }, data: { organismeId: null } })
      // Détacher les users de cet organisme
      await tx.user.updateMany({ where: { organismeId: id }, data: { organismeId: null } })
      await tx.organisme.delete({ where: { id } })
    })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
