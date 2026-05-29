import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function parseSession(token: string) {
  try {
    const decoded = atob(token)
    const parts = decoded.split('|')
    if (parts.length < 3) return null
    if (parts[2] !== (process.env.AUTH_SECRET || 'cs-secret-key')) return null
    return { username: parts[0], role: parts[1] }
  } catch { return null }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Chemins publics
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/inscription') ||   // Page d'inscription publique
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/register') ||  // API inscription publique
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/public/bassin') ||  // Page publique QR — sans auth
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname === '/icon-192.png' ||
    pathname === '/icon-512.png'
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('cs_session')?.value
  if (!token) return redirect(request, pathname)
  const session = parseSession(token)
  if (!session) return redirect(request, pathname)

  const { role } = session

  // /superadmin → superadmin uniquement
  if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // /admin → superadmin + responsable_organisme + responsable_groupe + responsable_etablissement
  if (pathname.startsWith('/admin')) {
    const allowed = ['superadmin', 'responsable_organisme', 'responsable_groupe', 'responsable_etablissement']
    if (!allowed.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // /etablissement → responsable_etablissement uniquement (les autres ont /mes-etablissements)
  if (pathname === '/etablissement') {
    const allowed = ['superadmin', 'responsable_organisme', 'responsable_groupe', 'responsable_etablissement']
    if (!allowed.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // /mes-etablissements → superadmin + responsable_organisme + responsable_groupe
  if (pathname.startsWith('/mes-etablissements')) {
    const allowed = ['superadmin', 'responsable_groupe', 'responsable_organisme']
    if (!allowed.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // /statistiques + /historique → pas responsable_saisie
  if (pathname === '/statistiques' || pathname === '/historique') {
    if (role === 'responsable_saisie') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user', session.username)
  requestHeaders.set('x-role', session.role)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

function redirect(req: NextRequest, from: string) {
  const url = new URL('/login', req.url)
  url.searchParams.set('from', from)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
