import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeStatus } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const releves = await prisma.releve.findMany()
    let updated = 0

    for (const r of releves) {
      const cc = r.chloreCombine !== null ? r.chloreCombine : null
      const newStatus = computeStatus(r.ph, r.chloreLibre, cc)
      if (newStatus !== r.status) {
        await prisma.releve.update({
          where: { id: r.id },
          data: { status: newStatus },
        })
        updated++
      }
    }

    return NextResponse.json({ total: releves.length, updated })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
