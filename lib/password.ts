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

// ── Token de session ─────────────────────────────────────────────────────────
export function makeSessionToken(username: string, role: string): string {
  const secret = process.env.AUTH_SECRET || 'cs-secret-key'
  return btoa(`${username}|${role}|${secret}`)
}

export function parseSessionToken(token: string): { username: string; role: string } | null {
  try {
    const decoded = atob(token)
    const parts = decoded.split('|')
    if (parts.length < 3) return null
    const secret = process.env.AUTH_SECRET || 'cs-secret-key'
    if (parts[2] !== secret) return null
    return { username: parts[0], role: parts[1] }
  } catch {
    return null
  }
}

// ── Hash SHA-256 legacy (pour migration) ─────────────────────────────────────
export function hashPasswordLegacy(password: string): string {
  const secret = process.env.AUTH_SECRET || 'cs-secret-key'
  return 'sha256:' + crypto.createHash('sha256').update(password + secret).digest('hex')
}
