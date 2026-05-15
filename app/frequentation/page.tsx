import { prisma } from '@/lib/prisma'
import FrequentationClient from './FrequentationClient'

export const dynamic = 'force-dynamic'

export default async function FrequentationPage() {
  const frequentations = await prisma.frequentation.findMany({
    orderBy: { date: 'desc' },
  }).catch(() => [])

  return <FrequentationClient initialData={JSON.parse(JSON.stringify(frequentations))} />
}
