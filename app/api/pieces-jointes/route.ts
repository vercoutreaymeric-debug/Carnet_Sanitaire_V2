import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

// GET /api/pieces-jointes?module=releve&moduleId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const module_ = searchParams.get('module')
  const moduleId = searchParams.get('moduleId')
  if (!module_ || !moduleId) return NextResponse.json({ error: 'module et moduleId requis' }, { status: 400 })

  const pjs = await prisma.pieceJointe.findMany({
    where: { module: module_, moduleId: parseInt(moduleId) },
    select: { id: true, nom: true, type: true, taille: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(pjs)
}

// POST /api/pieces-jointes  (multipart/form-data)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const module_ = formData.get('module') as string
    const moduleId = parseInt(formData.get('moduleId') as string)

    if (!file || !module_ || !moduleId) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Type de fichier non autorisé (JPEG, PNG, PDF uniquement)' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const pj = await prisma.pieceJointe.create({
      data: { module: module_, moduleId, nom: file.name, type: file.type, taille: file.size, data: base64 },
    })

    return NextResponse.json({ id: pj.id, nom: pj.nom, type: pj.type, taille: pj.taille, createdAt: pj.createdAt }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
