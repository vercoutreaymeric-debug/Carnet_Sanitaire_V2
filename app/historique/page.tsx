import { prisma } from '@/lib/prisma'
import HistoriqueClient from './HistoriqueClient'
export const dynamic = 'force-dynamic'

export default async function HistoriquePage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  }).catch(() => [])

  return <HistoriqueClient logs={JSON.parse(JSON.stringify(logs))} />
}
