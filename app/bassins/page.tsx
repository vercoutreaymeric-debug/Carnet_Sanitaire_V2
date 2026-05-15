import { prisma } from '@/lib/prisma'
import BassinsClient from './BassinsClient'

export const dynamic = 'force-dynamic'

export default async function BassinsPage() {
  const bassins = await prisma.bassin.findMany({ orderBy: { createdAt: 'asc' } }).catch(() => [])
  return <BassinsClient initialData={JSON.parse(JSON.stringify(bassins))} />
}
