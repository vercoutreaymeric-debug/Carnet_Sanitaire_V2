import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const BCRYPT_ROUNDS = 12

// ── Hachage bcrypt (nouveaux mots de passe) ─────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Nouveau hash bcrypt (préfixe $2b$ ou $2a$)
  if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
    return bcrypt.compare(password, hash)
  }
  // Compatibilité : anciens hashs SHA-256 (avec ou sans préfixe "sha256:")
  const secret = process.env.AUTH_SECRET || 'cs-secret-key'
  const rawHash = hash.startsWith('sha256:') ? hash.slice(7) : hash
  const sha = crypto.createHash('sha256').update(password + secret).digest('hex')
  return sha === rawHash
}

// ── Token de session : username|role|secret|etablissementId|groupeId|organismeId ──
export function makeSessionToken(
  username: string,
  role: string,
  etablissementId?: number | null,
  groupeId?: number | null,
  organismeId?: number | null,
): string {
  const secret = process.env.AUTH_SECRET || 'cs-secret-key'
  const e = etablissementId != null ? `${etablissementId}` : ''
  const g = groupeId        != null ? `${groupeId}`        : ''
  const o = organismeId     != null ? `${organismeId}`     : ''
  return btoa(`${username}|${role}|${secret}|${e}|${g}|${o}`)
}

export function parseSessionToken(token: string): {
  username: string
  role: string
  etablissementId: number | null
  groupeId: number | null
  organismeId: number | null
} | null {
  try {
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

// ── Hash SHA-256 legacy (pour migration) ─────────────────────────────────────
export function hashPasswordLegacy(password: string): string {
  const secret = process.env.AUTH_SECRET || 'cs-secret-key'
  return 'sha256:' + crypto.createHash('sha256').update(password + secret).digest('hex')
}
