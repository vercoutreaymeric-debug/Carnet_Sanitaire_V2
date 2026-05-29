import { prisma } from '@/lib/prisma'
import type { SessionUser } from '@/lib/auth'

/**
 * Retourne le filtre Prisma pour restreindre les requêtes à l'établissement(s) accessible(s).
 * - superadmin              → {} (pas de filtre, tout voir)
 * - responsable_groupe      → { etablissementId: { in: [ids des étabs du groupe] } }
 * - responsable_organisme   → { etablissementId: { in: [ids des étabs de l'organisme] } }
 * - tous les autres         → { etablissementId: session.etablissementId }
 */
export async function getEtabFilter(session: SessionUser): Promise<{ etablissementId?: number | { in: number[] } }> {
  if (session.role === 'superadmin') return {}

  if (session.role === 'responsable_groupe' && session.groupeId) {
    const etabs = await prisma.etablissement.findMany({
      where: { organisme: { groupeId: session.groupeId } },
      select: { id: true },
    })
    const ids = etabs.map(e => e.id)
    return { etablissementId: { in: ids } }
  }

  if (session.role === 'responsable_organisme' && session.organismeId) {
    const etabs = await prisma.etablissement.findMany({
      where: { organismeId: session.organismeId },
      select: { id: true },
    })
    const ids = etabs.map(e => e.id)
    return { etablissementId: { in: ids } }
  }

  return { etablissementId: session.etablissementId as number }
}

/**
 * Vérifie qu'un établissement est accessible pour la session.
 */
export async function canAccessEtab(session: SessionUser, etablissementId: number): Promise<boolean> {
  if (session.role === 'superadmin') return true

  if (session.role === 'responsable_groupe' && session.groupeId) {
    const etab = await prisma.etablissement.findFirst({
      where: { id: etablissementId, organisme: { groupeId: session.groupeId } },
    })
    return etab !== null
  }

  if (session.role === 'responsable_organisme' && session.organismeId) {
    const etab = await prisma.etablissement.findFirst({
      where: { id: etablissementId, organismeId: session.organismeId },
    })
    return etab !== null
  }

  return session.etablissementId === etablissementId
}
