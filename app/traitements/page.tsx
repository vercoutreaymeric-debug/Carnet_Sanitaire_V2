import { prisma } from '@/lib/prisma'
import TraitementsClient from './TraitementsClient'

export const dynamic = 'force-dynamic'

export default async function TraitementsPage() {
  const [traitements, bassins] = await Promise.all([
    prisma.traitement.findMany({ orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }).catch(() => []),
    prisma.bassin.findMany({ orderBy: { createdAt: 'asc' } }).catch(() => []),
  ])

  return (
    <TraitementsClient
      initialData={JSON.parse(JSON.stringify(traitements))}
      bassins={bassins}
    />
  )
}
