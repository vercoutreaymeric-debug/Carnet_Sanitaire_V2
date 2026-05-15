import crypto from 'crypto'

function salt() {
  return process.env.AUTH_SECRET || 'cs-secret-key'
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + salt()).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

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
