export type Role = 'superadmin' | 'responsable_groupe' | 'responsable_organisme' | 'responsable_etablissement' | 'responsable_saisie' | 'visualisateur' | 'controleur_ars'

export const ROLE_LABELS: Record<Role, { fr: string; en: string }> = {
  superadmin:                { fr: 'Super Admin',                en: 'Super Admin' },
  responsable_groupe:        { fr: 'Responsable de Groupe',      en: 'Group Manager' },
  responsable_organisme:     { fr: "Responsable d'Organisme",    en: 'Organisation Manager' },
  responsable_etablissement: { fr: "Responsable d'Établissement", en: 'Establishment Manager' },
  responsable_saisie:        { fr: 'Responsable de Saisie',      en: 'Data Entry' },
  visualisateur:             { fr: 'Auditeur',                   en: 'Auditor' },
  controleur_ars:            { fr: 'Contrôleur ARS',             en: 'ARS Inspector' },
}

export const ROLE_COLORS: Record<Role, string> = {
  superadmin:                '#9333ea',
  responsable_groupe:        '#0097A7',
  responsable_organisme:     '#00aeef',
  responsable_etablissement: '#10b981',
  responsable_saisie:        '#f97316',
  visualisateur:             '#6b7280',
  controleur_ars:            '#1e40af',
}

// ── Permissions ──────────────────────────────────────────────────────────────

/** Saisir relevés et interventions */
export function peutSaisir(role: Role) {
  return ['responsable_groupe', 'responsable_organisme', 'responsable_etablissement', 'responsable_saisie'].includes(role)
}

/** Modifier toute donnée */
export function peutModifier(role: Role) {
  return ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement', 'responsable_saisie'].includes(role)
}

/** Valider un relevé */
export function peutValider(role: Role) {
  return ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement'].includes(role)
}

/** Supprimer un relevé (document réglementaire — superadmin uniquement) */
export function peutSupprimerReleve(role: Role) {
  return role === 'superadmin'
}

/** Accès Contrôleur ARS — lecture seule relevés validés */
export function estControleurARS(role: Role) {
  return role === 'controleur_ars'
}

/** Supprimer autres données (interventions, contacts, bassins…) */
export function peutSupprimer(role: Role) {
  return ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement'].includes(role)
}

/** Gérer les utilisateurs */
export function peutGererUtilisateurs(role: Role) {
  return ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement'].includes(role)
}

/** Voir statistiques et historique */
export function peutVoirStats(role: Role) {
  return ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement', 'visualisateur', 'controleur_ars'].includes(role)
}

/** Sauvegarder et restaurer */
export function peutSauvegarder(role: Role) {
  return ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement'].includes(role)
}

/** Paramètres établissement */
export function peutGererEtab(role: Role) {
  return ['responsable_groupe', 'responsable_organisme', 'responsable_etablissement'].includes(role)
}

/** Section debug superadmin */
export function estSuperAdmin(role: Role) {
  return role === 'superadmin'
}
