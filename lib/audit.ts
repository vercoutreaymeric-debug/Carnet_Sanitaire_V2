import { prisma } from './prisma'

export async function logAction(action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE', module: string, detail: string) {
  try {
    await prisma.auditLog.create({ data: { action, module, detail } })
  } catch {
    // Ne jamais faire planter une route à cause du log
  }
}
