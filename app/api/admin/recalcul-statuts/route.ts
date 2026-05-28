import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { computeStatus } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function getRole(): string | null {
  try {
    const session = cookies().get('cs_session')?.value
    if (!session) return null
    const parts = atob(session).split('|')
    const secret = process.env.AUTH_SECRET || 'cs-secret-key'
    if (parts.length < 3 || parts[2] !== secret) return null
    return parts[1] ?? null
  } catch { return null }
}

export async function POST() {
  const role = getRole()
  if (!['superadmin', 'admin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }
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
