'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Role } from '@/lib/roles'
import { peutSaisir, peutModifier, peutSupprimerReleve, peutSupprimer, peutGererUtilisateurs, peutVoirStats, peutSauvegarder, peutGererEtab, estSuperAdmin, peutValider, estControleurARS } from '@/lib/roles'

interface AuthUser { username: string; role: Role; nom: string }
interface AuthCtx {
  user: AuthUser | null
  loading: boolean
  canCreate: boolean       // Saisir relevés/interventions
  canEdit: boolean         // Modifier données
  canDeleteReleve: boolean // Supprimer relevés (superadmin uniquement)
  canDelete: boolean       // Supprimer autres données
  canManageUsers: boolean  // Gérer utilisateurs
  canViewStats: boolean    // Statistiques + Historique
  canBackup: boolean       // Sauvegarde / Restauration
  canManageEtab: boolean   // Paramètres établissement
  isSuperAdmin: boolean    // Section debug
  canValider: boolean      // Valider les relevés
  isControleurARS: boolean // Rôle ARS — lecture seule validés
}

const defaultCtx: AuthCtx = {
  user: null, loading: true,
  canCreate: false, canEdit: false, canDeleteReleve: false, canDelete: false,
  canManageUsers: false, canViewStats: false, canBackup: false, canManageEtab: false,
  isSuperAdmin: false, canValider: false, isControleurARS: false,
}

const Ctx = createContext<AuthCtx>(defaultCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        setUser(d.user)
        setLoading(false)
        // Session expirée / utilisateur supprimé → redirect login
        if (!d.user && pathname !== '/login') {
          router.replace(`/login?from=${encodeURIComponent(pathname)}`)
        }
      })
      .catch(() => {
        setLoading(false)
        if (pathname !== '/login') router.replace('/login')
      })
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const role = user?.role as Role | undefined

  return (
    <Ctx.Provider value={{
      user, loading,
      canCreate:       role ? peutSaisir(role)             : false,
      canEdit:         role ? peutModifier(role)           : false,
      canDeleteReleve: role ? peutSupprimerReleve(role)    : false,
      canDelete:       role ? peutSupprimer(role)          : false,
      canManageUsers:  role ? peutGererUtilisateurs(role)  : false,
      canViewStats:    role ? peutVoirStats(role)          : false,
      canBackup:       role ? peutSauvegarder(role)        : false,
      canManageEtab:   role ? peutGererEtab(role)          : false,
      isSuperAdmin:    role ? estSuperAdmin(role)          : false,
      canValider:      role ? peutValider(role)            : false,
      isControleurARS: role ? estControleurARS(role)       : false,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() { return useContext(Ctx) }
