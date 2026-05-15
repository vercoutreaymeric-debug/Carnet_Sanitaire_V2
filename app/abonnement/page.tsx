import { prisma } from '@/lib/prisma'
import AbonnementClient from './AbonnementClient'
export const dynamic = 'force-dynamic'

export default async function AbonnementPage() {
  const abonnement = await prisma.abonnement.findUnique({ where: { id: 1 } }).catch(() => null)
  const [bassinsCount, usersCount] = await Promise.all([
    prisma.bassin.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
  ])

  // Si pas encore créé → valeurs par défaut d'affichage
  const defaultExpiry = new Date()
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1)

  const data = abonnement ?? {
    id: 1, plan: 'Starter', statut: 'essai',
    dateDebut: new Date(), dateExpiration: defaultExpiry,
    maxBassins: 5, maxUtilisateurs: 10, notes: '',
    updatedAt: new Date(),
  }

  return <AbonnementClient abonnement={data} bassinsCount={bassinsCount} usersCount={usersCount} />
}
