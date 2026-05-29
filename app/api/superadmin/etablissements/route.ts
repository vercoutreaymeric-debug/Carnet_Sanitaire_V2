import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
export const dynamic = 'force-dynamic'

// GET — liste tous les établissements avec leur abonnement et nb utilisateurs
export async function GET() {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const etablissements = await prisma.etablissement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      abonnement: true,
      _count: { select: { users: true, bassins: true, releves: true } },
    },
  })
  return NextResponse.json(etablissements)
}

// POST — crée un nouvel établissement + abonnement + compte admin
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  try {
    const body = await req.json()
    const {
      // Établissement
      nom, adresse = '', telephone = '',
      // Abonnement
      plan = 'Starter', statut = 'essai',
      dateDebut, dateExpiration,
      maxBassins = 5, maxUtilisateurs = 10,
      notes = '',
      // Compte admin
      adminUsername, adminPassword, adminNom = '',
    } = body

    if (!nom || !adminUsername || !adminPassword) {
      return NextResponse.json({ error: 'Nom, identifiant admin et mot de passe requis' }, { status: 400 })
    }

    // Vérifier que l'username n'existe pas déjà
    const existingUser = await prisma.user.findUnique({ where: { username: adminUsername } })
    if (existingUser) return NextResponse.json({ error: 'Cet identifiant est déjà utilisé' }, { status: 409 })

    const expiry = dateExpiration ? new Date(dateExpiration) : new Date(Date.now() + 365 * 86400000)
    const debut  = dateDebut      ? new Date(dateDebut)      : new Date()

    // Transaction : créer établissement + abonnement + utilisateur admin
    const result = await prisma.$transaction(async (tx) => {
      const etab = await tx.etablissement.create({
        data: { nom, adresse, telephone },
      })

      await tx.abonnement.create({
        data: {
          etablissementId: etab.id,
          plan, statut,
          dateDebut: debut,
          dateExpiration: expiry,
          maxBassins: parseInt(String(maxBassins)),
          maxUtilisateurs: parseInt(String(maxUtilisateurs)),
          notes,
        },
      })

      const hashedPw = await hashPassword(adminPassword)
      const user = await tx.user.create({
        data: {
          username: adminUsername,
          password: hashedPw,
          role: 'responsable_etablissement',
          nom: adminNom || adminUsername,
          etablissementId: etab.id,
        },
      })

      return { etab, user }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
