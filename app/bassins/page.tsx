import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BassinsClient from './BassinsClient'
export const dynamic = 'force-dynamic'

export default async function BassinsPage() {
  const session = getSession()
  if (!session) redirect('/login')

  // Filtre selon le rôle
  let where: Record<string, unknown> = {}
  if (session.role === 'superadmin') {
    where = {}
  } else if (session.role === 'responsable_groupe' && session.groupeId) {
    where = { etablissement: { organisme: { groupeId: session.groupeId } } }
  } else if (session.role === 'responsable_organisme' && session.organismeId) {
    where = { etablissement: { organismeId: session.organismeId } }
  } else if (session.etablissementId) {
    where = { etablissementId: session.etablissementId }
  }

  const bassins = await prisma.bassin.findMany({
    where, orderBy: { createdAt: 'asc' },
  }).catch(() => [])

  // Pour les rôles multi-étab : charger la liste des établissements accessibles
  let etabsDisponibles: { id: number; nom: string }[] = []
  if (session.role === 'superadmin') {
    etabsDisponibles = await prisma.etablissement.findMany({ select: { id: true, nom: true }, orderBy: { nom: 'asc' } }).catch(() => [])
  } else if (session.role === 'responsable_groupe' && session.groupeId) {
    etabsDisponibles = await prisma.etablissement.findMany({ where: { organisme: { groupeId: session.groupeId } }, select: { id: true, nom: true }, orderBy: { nom: 'asc' } }).catch(() => [])
  } else if (session.role === 'responsable_organisme' && session.organismeId) {
    etabsDisponibles = await prisma.etablissement.findMany({ where: { organismeId: session.organismeId }, select: { id: true, nom: true }, orderBy: { nom: 'asc' } }).catch(() => [])
  }

  return (
    <BassinsClient
      initialData={JSON.parse(JSON.stringify(bassins))}
      etabsDisponibles={JSON.parse(JSON.stringify(etabsDisponibles))}
      userRole={session.role}
    />
  )
}
