import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      // Établissement
      nomEtablissement, adresse = '', telephone = '',
      // Contact
      nomContact, email,
      // Compte
      username, password,
      // Plan
      plan = 'Starter',
    } = body

    if (!nomEtablissement || !username || !password || !email || !nomContact) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent être remplis.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit faire au moins 6 caractères.' }, { status: 400 })
    }

    // Vérifier que l'username n'existe pas déjà
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json({ error: 'Cet identifiant est déjà utilisé. Choisissez-en un autre.' }, { status: 409 })
    }

    // Durée essai : 30 jours
    const dateExpiration = new Date(Date.now() + 30 * 86400000)
    const maxBassins     = plan === 'Pro' ? 15 : plan === 'Intégral' ? 999 : 5
    const maxUtilisateurs = plan === 'Pro' ? 30 : plan === 'Intégral' ? 999 : 10

    // Transaction : établissement + abonnement + user
    const result = await prisma.$transaction(async (tx) => {
      const etab = await tx.etablissement.create({
        data: { nom: nomEtablissement, adresse, telephone },
      })

      await tx.abonnement.create({
        data: {
          etablissementId: etab.id,
          plan,
          statut: 'essai',
          dateDebut: new Date(),
          dateExpiration,
          maxBassins,
          maxUtilisateurs,
          notes: `Inscription en ligne — Contact : ${nomContact} <${email}>`,
        },
      })

      const hashedPw = await hashPassword(password)
      const user = await tx.user.create({
        data: {
          username,
          password: hashedPw,
          role: 'responsable_etablissement',
          nom: nomContact,
          email,
          etablissementId: etab.id,
        },
      })

      return { etab, user }
    })

    return NextResponse.json({
      ok: true,
      etablissementId: result.etab.id,
      nom: nomEtablissement,
      username,
      plan,
      essaiJusquau: dateExpiration.toLocaleDateString('fr-FR'),
    }, { status: 201 })

  } catch (e) {
    console.error('[POST /api/register]', e)
    return NextResponse.json({ error: 'Erreur serveur. Veuillez réessayer.' }, { status: 500 })
  }
}
