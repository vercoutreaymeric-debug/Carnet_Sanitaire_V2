import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Vérifie que la requête provient d'un utilisateur authentifié, retourne son role
function getRole(): string | null {
  const token = cookies().get('cs_session')?.value
  if (!token) return null
  try {
    const decoded = atob(token)
    const [, role] = decoded.split('|')
    return role ?? null
  } catch { return null }
}

// GET /api/abonnement — tout utilisateur authentifié
export async function GET() {
  const role = getRole()
  if (!role) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let abonnement = await prisma.abonnement.findUnique({ where: { id: 1 } }).catch(() => null)

  // Crée un enregistrement par défaut si absent
  if (!abonnement) {
    const defaultExpiry = new Date()
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1)
    abonnement = await prisma.abonnement.create({
      data: { id: 1, plan: 'Starter', statut: 'essai', dateExpiration: defaultExpiry, maxBassins: 5, maxUtilisateurs: 10, notes: '' },
    }).catch(() => null)
  }

  // Compte les ressources utilisées
  const [bassinsCount, usersCount] = await Promise.all([
    prisma.bassin.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
  ])

  return NextResponse.json({ abonnement, bassinsCount, usersCount })
}

// PATCH /api/abonnement — superadmin uniquement
export async function PATCH(req: NextRequest) {
  const role = getRole()
  if (role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()

  const abonnement = await prisma.abonnement.upsert({
    where: { id: 1 },
    update: {
      plan:           body.plan           ?? undefined,
      statut:         body.statut         ?? undefined,
      dateDebut:      body.dateDebut      ? new Date(body.dateDebut)      : undefined,
      dateExpiration: body.dateExpiration ? new Date(body.dateExpiration) : undefined,
      maxBassins:     body.maxBassins     !== undefined ? parseInt(body.maxBassins)     : undefined,
      maxUtilisateurs:body.maxUtilisateurs!== undefined ? parseInt(body.maxUtilisateurs): undefined,
      notes:          body.notes          ?? undefined,
    },
    create: {
      id: 1,
      plan:            body.plan            ?? 'Starter',
      statut:          body.statut          ?? 'essai',
      dateDebut:       body.dateDebut       ? new Date(body.dateDebut)       : new Date(),
      dateExpiration:  body.dateExpiration  ? new Date(body.dateExpiration)  : new Date(Date.now() + 365 * 86400000),
      maxBassins:      body.maxBassins      !== undefined ? parseInt(body.maxBassins)      : 5,
      maxUtilisateurs: body.maxUtilisateurs !== undefined ? parseInt(body.maxUtilisateurs) : 10,
      notes:           body.notes           ?? '',
    },
  })

  return NextResponse.json(abonnement)
}
