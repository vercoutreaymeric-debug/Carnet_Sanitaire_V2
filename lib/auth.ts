import { cookies } from 'next/headers'

export interface SessionUser {
  username: string
  role: string
  etablissementId: number | null  // null = superadmin, responsable_groupe, responsable_organisme
  groupeId: number | null         // non null = responsable_groupe
  organismeId: number | null      // non null = responsable_organisme
}

// ── Lecture de la session côté serveur ───────────────────────────────────────
export function getSession(): SessionUser | null {
  try {
    const token = cookies().get('cs_session')?.value
    if (!token) return null
    const decoded = atob(token)
    const parts = decoded.split('|')
    if (parts.length < 3) return null
    const secret = process.env.AUTH_SECRET || 'cs-secret-key'
    if (parts[2] !== secret) return null
    const etabRaw  = parts[3] ? parseInt(parts[3]) : null
    const groupRaw = parts[4] ? parseInt(parts[4]) : null
    const orgRaw   = parts[5] ? parseInt(parts[5]) : null
    return {
      username: parts[0],
      role: parts[1],
      etablissementId: etabRaw  && !isNaN(etabRaw)  ? etabRaw  : null,
      groupeId:        groupRaw && !isNaN(groupRaw)  ? groupRaw : null,
      organismeId:     orgRaw   && !isNaN(orgRaw)    ? orgRaw   : null,
    }
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export function requireEtablissement(): number {
  const session = getSession()
  if (!session) throw new Error('NOT_AUTHENTICATED')
  if (session.role === 'superadmin') throw new Error('SUPERADMIN_NO_ETAB')
  if (session.role === 'responsable_groupe') throw new Error('GROUPE_NO_SINGLE_ETAB')
  if (session.role === 'responsable_organisme') throw new Error('ORGANISME_NO_SINGLE_ETAB')
  if (!session.etablissementId) throw new Error('NO_ETABLISSEMENT')
  return session.etablissementId
}

export function makeSessionToken(
  username: string,
  role: string,
  etablissementId: number | null,
  groupeId?: number | null,
  organismeId?: number | null,
): string {
  const secret = process.env.AUTH_SECRET || 'cs-secret-key'
  const e = etablissementId != null ? `${etablissementId}` : ''
  const g = groupeId        != null ? `${groupeId}`        : ''
  const o = organismeId     != null ? `${organismeId}`     : ''
  return btoa(`${username}|${role}|${secret}|${e}|${g}|${o}`)
}
