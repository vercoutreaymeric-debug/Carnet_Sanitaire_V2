import { prisma } from '@/lib/prisma'
import InterventionsClient from './InterventionsClient'

export const dynamic = 'force-dynamic'

export default async function InterventionsPage() {
  const [interventions, bassins] = await Promise.all([
    prisma.intervention.findMany({ orderBy: [{ date: 'desc' }, { heure: 'desc' }] }).catch(() => []),
    prisma.bassin.findMany({ orderBy: { createdAt: 'asc' } }).catch(() => []),
  ])

  return (
    <InterventionsClient
      initialData={JSON.parse(JSON.stringify(interventions))}
      bassins={bassins.map(b => b.nom)}
    />
  )
}
