/**
 * Script de migration des données locales vers Neon
 * Lance avec : tsx prisma/migrate-to-neon.ts
 */
import { PrismaClient } from '@prisma/client'

const LOCAL_URL = "postgresql://postgres:cifec123456789%2A%2F@localhost:5432/carnet_sanitaire"
const NEON_URL  = "postgresql://neondb_owner:npg_1zCkwDdu3BlE@ep-bitter-mode-almv2fib.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require"

const local = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } })
const neon  = new PrismaClient({ datasources: { db: { url: NEON_URL  } } })

async function main() {
  console.log('📦 Lecture des données locales...')

  const [
    etablissement,
    bassins,
    releves,
    frequentations,
    interventions,
    contacts,
    users,
    abonnement,
    auditLogs,
  ] = await Promise.all([
    local.etablissement.findMany(),
    local.bassin.findMany(),
    local.releve.findMany(),
    local.frequentation.findMany(),
    local.intervention.findMany(),
    local.contact.findMany(),
    local.user.findMany(),
    local.abonnement.findMany(),
    local.auditLog.findMany(),
  ])

  console.log(`✅ Lu : ${bassins.length} bassins, ${releves.length} relevés, ${users.length} utilisateurs`)
  console.log('🚀 Envoi vers Neon...')

  // Nettoyage Neon
  await neon.auditLog.deleteMany()
  await neon.releve.deleteMany()
  await neon.bassin.deleteMany()
  await neon.frequentation.deleteMany()
  await neon.intervention.deleteMany()
  await neon.contact.deleteMany()
  await neon.user.deleteMany()
  await neon.abonnement.deleteMany()
  await neon.etablissement.deleteMany()

  // Import
  if (etablissement.length > 0) {
    for (const e of etablissement) await neon.etablissement.create({ data: e })
  }

  for (const b of bassins) {
    const { releves: _, ...bassin } = b as any
    await neon.bassin.create({ data: bassin })
  }

  for (const r of releves) await neon.releve.create({ data: r })
  for (const f of frequentations) await neon.frequentation.create({ data: f })
  for (const i of interventions) await neon.intervention.create({ data: i })
  for (const c of contacts) await neon.contact.create({ data: c })
  for (const u of users) await neon.user.create({ data: u })
  for (const a of abonnement) await neon.abonnement.create({ data: a })
  for (const l of auditLogs) await neon.auditLog.create({ data: l })

  console.log('🎉 Migration terminée ! Neon est maintenant identique à ta base locale.')
}

main()
  .catch(e => { console.error('❌ Erreur :', e); process.exit(1) })
  .finally(async () => { await local.$disconnect(); await neon.$disconnect() })
