import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const intervention = await prisma.intervention.update({
    where: { id: parseInt(params.id) },
    data: { status: body.status },
  })
  return NextResponse.json(intervention)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.intervention.delete({ where: { id: parseInt(params.id) } })
  return new NextResponse(null, { status: 204 })
}
