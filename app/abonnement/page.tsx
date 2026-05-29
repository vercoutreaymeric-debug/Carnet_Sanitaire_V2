import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AbonnementClient from './AbonnementClient'
import SuperAdminAbonnements from './SuperAdminAbonnements'
export const dynamic = 'force-dynamic'

export default async function AbonnementPage() {
  const session = getSession()
  if (!session) redirect('/login')

  // ── Vue superadmin : liste de tous les abonnements ───────────────────────
  if (session.role === 'superadmin') {
    const [etablissements, groupes, organismes] = await Promise.all([
      prisma.etablissement.findMany({
        include: {
          abonnement: true,
          organisme: { include: { groupe: true } },
          _count: { select: { bassins: true, users: true, releves: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.groupe.findMany({
        include: {
          organismes: {
            include: {
              etablissements: {
                include: {
                  abonnement: true,
                  _count: { select: { bassins: true, users: true, releves: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organisme.findMany({
        include: {
          groupe: { select: { id: true, nom: true } },
          etablissements: {
            include: {
              abonnement: true,
              _count: { select: { bassins: true, users: true, releves: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])
    return <SuperAdminAbonnements etablissements={etablissements} groupes={groupes} organismes={organismes} />
  }

  // ── Vue client : abonnement de son établissement ─────────────────────────
  const etabId = session.etablissementId
  if (!etabId) redirect('/dashboard')

  const [abonnement, bassinsCount, usersCount] = await Promise.all([
    prisma.abonnement.findUnique({ where: { etablissementId: etabId } }),
    prisma.bassin.count({ where: { etablissementId: etabId } }),
    prisma.user.count({ where: { etablissementId: etabId } }),
  ])

  const defaultExpiry = new Date()
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1)

  const data = abonnement ?? {
    plan: 'Starter', statut: 'essai',
    dateDebut: new Date(), dateExpiration: defaultExpiry,
    maxBassins: 5, maxUtilisateurs: 10, notes: '',
    updatedAt: new Date(),
  }

  return <AbonnementClient abonnement={data} bassinsCount={bassinsCount} usersCount={usersCount} />
}
