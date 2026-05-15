import { prisma } from '@/lib/prisma'
import EtablissementClient from './EtablissementClient'

export const dynamic = 'force-dynamic'

const defaultEtab = {
  id: 1, nom: '', adresse: '', telephone: '',
  capaciteBaigneursCouvert: 0, capaciteVisiteursCouvert: 0,
  capaciteBaigneursPleinAir: 0, capaciteVisiteursPleinAir: 0,
  updatedAt: new Date().toISOString(),
}

export default async function EtablissementPage() {
  const etab = await prisma.etablissement.findUnique({ where: { id: 1 } }).catch(() => null)
  return <EtablissementClient initialData={etab ? JSON.parse(JSON.stringify(etab)) : defaultEtab} />
}
