import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: Record<string, unknown> = {}
  if (date) where.date = date
  if (from || to) {
    where.date = { gte: from ?? undefined, lte: to ?? undefined }
  }

  const frequentations = await prisma.frequentation.findMany({
    where,
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(frequentations)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const scolaire = parseInt(body.scolaire) || 0
  const club = parseInt(body.club) || 0
  const publicCount = parseInt(body.publicCount) || 0
  const autre = parseInt(body.autre) || 0
  const total = scolaire + club + publicCount + autre
  const reportEau = body.reportEau ? parseFloat(body.reportEau) : null
  const releveEau = body.releveEau ? parseFloat(body.releveEau) : null
  const totalEau = reportEau !== null && releveEau !== null ? releveEau - reportEau : null
  const litresParBaigneur = totalEau !== null && total > 0 ? Math.round((totalEau / total) * 1000 * 10) / 10 : null

  const freq = await prisma.frequentation.create({
    data: { date: body.date, scolaire, club, publicCount, autre, total, reportEau, releveEau, totalEau, litresParBaigneur },
  })
  return NextResponse.json(freq, { status: 201 })
}
