import { prisma } from '@/lib/prisma'
import RelevesClient from './RelevesClient'

export const dynamic = 'force-dynamic'

export default async function RelevesPage() {
  const [releves, bassins] = await Promise.all([
    prisma.releve.findMany({ orderBy: [{ date: 'desc' }, { heure: 'desc' }] }).catch(() => []),
    prisma.bassin.findMany({ orderBy: { createdAt: 'asc' } }).catch(() => []),
  ])

  return (
    <RelevesClient
      initialReleves={JSON.parse(JSON.stringify(releves))}
      initialBassins={JSON.parse(JSON.stringify(bassins))}
    />
  )
}
