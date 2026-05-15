import { prisma } from '@/lib/prisma'
import StatistiquesClient from './StatistiquesClient'
export const dynamic = 'force-dynamic'

export default async function StatistiquesPage() {
  const [releves, frequentations, interventions] = await Promise.all([
    prisma.releve.findMany({ orderBy: [{ date: 'asc' }, { heure: 'asc' }], select: { date: true, heure: true, ph: true, chloreLibre: true, status: true, bassinNom: true } }).catch(() => []),
    prisma.frequentation.findMany({ orderBy: { date: 'asc' } }).catch(() => []),
    prisma.intervention.findMany({ orderBy: { date: 'asc' } }).catch(() => []),
  ])

  return (
    <StatistiquesClient
      releves={JSON.parse(JSON.stringify(releves))}
      frequentations={JSON.parse(JSON.stringify(frequentations))}
      interventions={JSON.parse(JSON.stringify(interventions))}
    />
  )
}
