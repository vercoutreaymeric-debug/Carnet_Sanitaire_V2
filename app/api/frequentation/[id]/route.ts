import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession()
  if (!session || !session.etablissementId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  await prisma.frequentation.deleteMany({ where: { id: parseInt(params.id), etablissementId: session.etablissementId } })
  return new NextResponse(null, { status: 204 })
}
