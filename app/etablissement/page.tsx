import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EtablissementClient from './EtablissementClient'
export const dynamic = 'force-dynamic'

export default async function EtablissementPage() {
  const session = getSession()
  if (!session) redirect('/login')
  if (!session.etablissementId) redirect('/dashboard')

  const etab = await prisma.etablissement.findUnique({
    where: { id: session.etablissementId },
  }).catch(() => null)

  if (!etab) redirect('/dashboard')

  return <EtablissementClient initialData={JSON.parse(JSON.stringify(etab))} />
}
