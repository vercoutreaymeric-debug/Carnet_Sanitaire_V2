import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import GroupeView from './GroupeView'
import OrganismeView from './OrganismeView'
export const dynamic = 'force-dynamic'

const ALLOWED = ['superadmin', 'responsable_groupe', 'responsable_organisme']

export default async function MesEtablissementsPage() {
  const session = getSession()
  if (!session) redirect('/login')
  if (!ALLOWED.includes(session.role)) redirect('/dashboard')

  // ── Vue responsable_groupe ────────────────────────────────────────────────
  if (session.role === 'responsable_groupe' || session.role === 'superadmin') {
    const where = session.role === 'superadmin' ? {} : { groupeId: session.groupeId }

    const [groupe, organismes] = await Promise.all([
      session.groupeId
        ? prisma.groupe.findUnique({ where: { id: session.groupeId } })
        : null,
      prisma.organisme.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          etablissements: {
            include: {
              abonnement: true,
              _count: { select: { users: true, bassins: true, releves: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          users: {
            where: { role: 'responsable_organisme' },
            select: { id: true, username: true, nom: true, email: true },
          },
          _count: { select: { etablissements: true } },
        },
      }),
    ])

    return (
      <GroupeView
        groupe={JSON.parse(JSON.stringify(groupe))}
        organismes={JSON.parse(JSON.stringify(organismes))}
        groupeId={session.groupeId ?? null}
      />
    )
  }

  // ── Vue responsable_organisme ─────────────────────────────────────────────
  const organismeId = session.organismeId
  const etablissementId = session.etablissementId // cas register (pas d'organismeId)

  const [organisme, etablissements] = await Promise.all([
    organismeId
      ? prisma.organisme.findUnique({ where: { id: organismeId } })
      : null,
    prisma.etablissement.findMany({
      where: organismeId
        ? { organismeId }
        : etablissementId
          ? { id: etablissementId }
          : { id: -1 }, // aucun
      orderBy: { createdAt: 'desc' },
      include: {
        abonnement: true,
        _count: { select: { users: true, bassins: true, releves: true } },
      },
    }),
  ])

  return (
    <OrganismeView
      organisme={JSON.parse(JSON.stringify(organisme))}
      etablissements={JSON.parse(JSON.stringify(etablissements))}
      organismeId={organismeId ?? null}
    />
  )
}
