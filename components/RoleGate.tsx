'use client'
import { useAuth } from '@/contexts/AuthContext'

type Props = { children: React.ReactNode }

export function CanCreate({ children }: Props) {
  const { canCreate } = useAuth()
  return canCreate ? <>{children}</> : null
}

export function CanEdit({ children }: Props) {
  const { canEdit } = useAuth()
  return canEdit ? <>{children}</> : null
}

export function CanDeleteReleve({ children }: Props) {
  const { canDeleteReleve } = useAuth()
  return canDeleteReleve ? <>{children}</> : null
}

export function CanDelete({ children }: Props) {
  const { canDelete } = useAuth()
  return canDelete ? <>{children}</> : null
}

export function CanManageUsers({ children }: Props) {
  const { canManageUsers } = useAuth()
  return canManageUsers ? <>{children}</> : null
}

export function CanViewStats({ children }: Props) {
  const { canViewStats } = useAuth()
  return canViewStats ? <>{children}</> : null
}

export function CanBackup({ children }: Props) {
  const { canBackup } = useAuth()
  return canBackup ? <>{children}</> : null
}

export function CanManageEtab({ children }: Props) {
  const { canManageEtab } = useAuth()
  return canManageEtab ? <>{children}</> : null
}

export function SuperAdminOnly({ children }: Props) {
  const { isSuperAdmin } = useAuth()
  return isSuperAdmin ? <>{children}</> : null
}

/** Gestion configuration (bassins, contacts) — exclut responsable_saisie et visualisateur */
export function CanManageConfig({ children }: Props) {
  const { user } = useAuth()
  const role = user?.role ?? ''
  return ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement'].includes(role) ? <>{children}</> : null
}

export function CanValider({ children }: Props) {
  const { canValider } = useAuth()
  return canValider ? <>{children}</> : null
}
