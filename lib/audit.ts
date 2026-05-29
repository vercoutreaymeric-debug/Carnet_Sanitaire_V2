import { prisma } from './prisma'

export async function logAction(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'NOTIFY',
  module: string,
  detail: string,
  etablissementId?: number | null,
) {
  try {
    if (!etablissementId) return // pas de log sans établissement
    await prisma.auditLog.create({ data: { action, module, detail, etablissementId } })
  } catch {
    // Ne jamais faire planter une route à cause du log
  }
}
