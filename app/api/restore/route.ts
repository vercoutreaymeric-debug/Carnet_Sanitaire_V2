import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.version || !body.exportDate) {
      return NextResponse.json({ error: 'Fichier de sauvegarde invalide' }, { status: 400 })
    }

    // Restauration dans une transaction — ordre respecté pour les clés étrangères
    await prisma.$transaction(async (tx) => {
      // 1. Suppression dans l'ordre inverse des dépendances
      await tx.releve.deleteMany()
      await tx.frequentation.deleteMany()
      await tx.intervention.deleteMany()
      await tx.contact.deleteMany()
      await tx.bassin.deleteMany()

      // 2. Établissement
      if (body.etablissement) {
        await tx.etablissement.upsert({
          where: { id: body.etablissement.id },
          update: { ...body.etablissement, id: undefined },
          create: body.etablissement,
        })
      }

      // 3. Bassins
      if (body.bassins?.length) {
        await tx.bassin.createMany({ data: body.bassins, skipDuplicates: true })
      }

      // 4. Relevés
      if (body.releves?.length) {
        await tx.releve.createMany({ data: body.releves, skipDuplicates: true })
      }

      // 5. Fréquentations
      if (body.frequentations?.length) {
        await tx.frequentation.createMany({ data: body.frequentations, skipDuplicates: true })
      }

      // 6. Interventions
      if (body.interventions?.length) {
        await tx.intervention.createMany({ data: body.interventions, skipDuplicates: true })
      }

      // 7. Contacts
      if (body.contacts?.length) {
        await tx.contact.createMany({ data: body.contacts, skipDuplicates: true })
      }
    })

    return NextResponse.json({
      ok: true,
      restored: {
        bassins: body.bassins?.length ?? 0,
        releves: body.releves?.length ?? 0,
        frequentations: body.frequentations?.length ?? 0,
        interventions: body.interventions?.length ?? 0,
        contacts: body.contacts?.length ?? 0,
      },
    })
  } catch (e) {
    console.error('Restore error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
