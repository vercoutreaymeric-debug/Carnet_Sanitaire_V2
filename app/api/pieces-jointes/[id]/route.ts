import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/pieces-jointes/[id]  → télécharge le fichier
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pj = await prisma.pieceJointe.findUnique({ where: { id: parseInt(params.id) } })
    if (!pj) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const buffer = Buffer.from(pj.data, 'base64')
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': pj.type,
        'Content-Disposition': `inline; filename="${encodeURIComponent(pj.nom)}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/pieces-jointes/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.pieceJointe.delete({ where: { id: parseInt(params.id) } })
  return new NextResponse(null, { status: 204 })
}
