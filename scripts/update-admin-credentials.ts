/**
 * Script de mise à jour des identifiants admin
 * Usage : npx ts-node scripts/update-admin-credentials.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const newUsername = process.env.NEW_USERNAME || 'ad'
  const newPassword = process.env.NEW_PASSWORD || 'ad'

  const hash = await bcrypt.hash(newPassword, 12)

  // Cherche l'admin existant (role admin)
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { username: newUsername, password: hash },
    })
    console.log(`✅ Admin mis à jour : ${admin.username} → ${newUsername}`)
  } else {
    // Crée l'admin s'il n'existe pas
    await prisma.user.create({
      data: {
        username: newUsername,
        password: hash,
        role: 'admin',
        nom: 'Administrateur',
      },
    })
    console.log(`✅ Admin créé : ${newUsername}`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
