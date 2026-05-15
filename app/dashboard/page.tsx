import { prisma } from '@/lib/prisma'
import { todayISO, currentMonthISO } from '@/lib/utils'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const today = todayISO()
  const monthPrefix = currentMonthISO()

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString().slice(0, 10)

  const [releves, interventions, frequentationsToday, relevesToday, relevesAValider] = await Promise.all([
    prisma.releve.findMany({ where: { date: { gte: since } }, orderBy: [{ date: 'asc' }, { heure: 'asc' }] }).catch(() => []),
    prisma.intervention.findMany({ orderBy: [{ date: 'desc' }] }).catch(() => []),
    prisma.frequentation.findMany({ where: { date: today } }).catch(() => []),
    prisma.releve.count({ where: { date: today } }).catch(() => 0),
    prisma.releve.count({ where: { valide: false } }).catch(() => 0),
  ])

  const interventionsCeMois = interventions.filter(i => i.date.startsWith(monthPrefix)).length
  const baigneursAujourdhui = frequentationsToday.reduce((sum, f) => sum + f.total, 0)

  return (
    <DashboardClient
      releves={JSON.parse(JSON.stringify(releves))}
      interventions={JSON.parse(JSON.stringify(interventions))}
      baigneursAujourdhui={baigneursAujourdhui}
      interventionsCeMois={interventionsCeMois}
      today={today}
      relevesToday={relevesToday}
      relevesAValider={relevesAValider}
    />
  )
}
