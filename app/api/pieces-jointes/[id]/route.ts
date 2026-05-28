import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

function isAuthenticated(): boolean {
  try {
    const session = cookies().get('cs_session')?.value
    if (!session) return false
    const parts = atob(session).split('|')
    const secret = process.env.AUTH_SECRET || 'cs-secret-key'
    return parts.length >= 3 && parts[2] === secret
  } catch { return false }
}

// GET /api/pieces-jointes/[id]  → télécharge le fichier
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated()) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
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
  if (!isAuthenticated()) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  await prisma.pieceJointe.delete({ where: { id: parseInt(params.id) } })
  return new NextResponse(null, { status: 204 })
}
