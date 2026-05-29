import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
export const dynamic = 'force-dynamic'

const ALLOWED = ['superadmin', 'responsable_groupe', 'responsable_organisme']

/** Retourne le filtre organismeId selon le rôle */
function getOrgFilter(session: NonNullable<ReturnType<typeof getSession>>) {
  if (session.role === 'superadmin') return {}
  if (session.role === 'responsable_organisme' && session.organismeId) {
    return { organismeId: session.organismeId }
  }
  if (session.role === 'responsable_organisme' && session.etablissementId) {
    // Cas register : pas encore d'organismeId, on retourne son seul établissement
    return { id: session.etablissementId }
  }
  if (session.role === 'responsable_groupe' && session.groupeId) {
    return { organisme: { groupeId: session.groupeId } }
  }
  return null
}

// GET — liste les établissements de l'organisme
export async function GET() {
  const session = getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const filter = getOrgFilter(session)
  if (filter === null) return NextResponse.json([])

  const etablissements = await prisma.etablissement.findMany({
    where: filter,
    orderBy: { createdAt: 'desc' },
    include: {
      abonnement: true,
      organisme: { select: { id: true, nom: true } },
      _count: { select: { users: true, bassins: true, releves: true } },
    },
  })
  return NextResponse.json(etablissements)
}

// POST — crée un nouvel établissement rattaché à l'organisme + compte responsable_etablissement
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session || !ALLOWED.includes(session.role)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      nom, adresse = '', telephone = '',
      adminUsername, adminPassword, adminNom = '', adminEmail = '',
      organismeId: bodyOrgId,
    } = body

    if (!nom) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    if (!adminUsername || !adminPassword) {
      return NextResponse.json({ error: 'Identifiant et mot de passe du responsable requis' }, { status: 400 })
    }

    // Détermine l'organismeId à utiliser
    let organismeId: number | null = null
    if (session.role === 'superadmin') {
      organismeId = bodyOrgId ? parseInt(bodyOrgId) : null
    } else if (session.role === 'responsable_organisme' && session.organismeId) {
      organismeId = session.organismeId
    } else if (session.role === 'responsable_groupe' && session.groupeId) {
      // Le groupe manager doit préciser l'organisme
      if (!bodyOrgId) return NextResponse.json({ error: 'organismeId requis' }, { status: 400 })
      const org = await prisma.organisme.findFirst({
        where: { id: parseInt(bodyOrgId), groupeId: session.groupeId },
      })
      if (!org) return NextResponse.json({ error: 'Organisme non autorisé' }, { status: 403 })
      organismeId = org.id
    }

    // Vérif username unique
    const existing = await prisma.user.findUnique({ where: { username: adminUsername } })
    if (existing) return NextResponse.json({ error: 'Cet identifiant est déjà utilisé' }, { status: 409 })

    const result = await prisma.$transaction(async (tx) => {
      const etab = await tx.etablissement.create({
        data: { nom, adresse, telephone, organismeId },
      })

      // Abonnement essai 30 jours par défaut
      await tx.abonnement.create({
        data: {
          etablissementId: etab.id,
          plan: 'Starter',
          statut: 'essai',
          dateDebut: new Date(),
          dateExpiration: new Date(Date.now() + 30 * 86400000),
          maxBassins: 5,
          maxUtilisateurs: 10,
          notes: `Créé par ${session.username}`,
        },
      })

      const hashedPw = await hashPassword(adminPassword)
      const user = await tx.user.create({
        data: {
          username: adminUsername,
          password: hashedPw,
          role: 'responsable_etablissement',
          nom: adminNom || adminUsername,
          email: adminEmail,
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
