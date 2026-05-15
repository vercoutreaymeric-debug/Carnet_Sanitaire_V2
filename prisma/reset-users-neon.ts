/**
 * Recrée les utilisateurs dans Neon avec les bons mots de passe
 * tsx prisma/reset-users-neon.ts
 */
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const NEON_URL = "postgresql://neondb_owner:npg_1zCkwDdu3BlE@ep-bitter-mode-almv2fib.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require"
const AUTH_SECRET = "cs-secret-key-cifec-2024"

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + AUTH_SECRET).digest('hex')
}

const neon = new PrismaClient({ datasources: { db: { url: NEON_URL } } })

async function main() {
  console.log('🗑️  Suppression des anciens utilisateurs...')
  await neon.user.deleteMany()

  console.log('👤 Création des utilisateurs...')
  await neon.user.createMany({
    data: [
      { username: 'superadmin', password: hashPassword('cifec_super_2024'), role: 'superadmin', nom: 'CIFEC Support' },
      { username: 'admin',      password: hashPassword('cifec2024'),        role: 'admin',      nom: 'Administrateur' },
    ]
  })

  console.log('✅ Utilisateurs créés dans Neon !')
  console.log('   admin       / cifec2024')
  console.log('   superadmin  / cifec_super_2024')
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => neon.$disconnect())
