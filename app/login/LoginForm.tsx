'use client'
import { useState, FormEvent, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'

// ── Types Turnstile (API native Cloudflare) ──────────────────────────────────
declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

export default function LoginForm() {
  const searchParams = useSearchParams()
  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [turnstileToken, setToken]    = useState<string | null>(null)
  const [widgetReady, setWidgetReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef  = useRef<string | null>(null)

  // Initialise le widget Turnstile une fois le script chargé
  const initWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !SITE_KEY) return
    if (widgetIdRef.current) return // déjà rendu

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: 'light',
      language: 'fr',
      callback: (token: string) => setToken(token),
      'expired-callback': () => setToken(null),
      'error-callback':   () => setToken(null),
    })
    setWidgetReady(true)
  }, [])

  // Le script Turnstile appelle window.onTurnstileLoad quand il est prêt
  useEffect(() => {
    window.onTurnstileLoad = initWidget
    // Si le script était déjà chargé (hot-reload)
    if (window.turnstile) initWidget()
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [initWidget])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!turnstileToken) {
      setError('Veuillez cocher la case anti-robot avant de continuer.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, turnstileToken }),
    })

    if (res.ok) {
      const from = searchParams.get('from') || '/dashboard'
      window.location.href = from
    } else {
      const data = await res.json()
      setError(data.error || 'Identifiants incorrects')
      setLoading(false)
      // Réinitialise le widget pour une nouvelle tentative
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
        setToken(null)
      }
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #dde5ee', fontSize: 14,
    fontFamily: 'DM Sans, sans-serif', color: '#0e4f6e',
    outline: 'none', transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }

  return (
    <>
      {/* Script Cloudflare Turnstile — chargé une seule fois */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad"
        strategy="lazyOnload"
      />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#4aaace', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            Identifiant
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="admin"
            autoComplete="username"
            required
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#00aeef')}
            onBlur={e => (e.target.style.borderColor = '#dde5ee')}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#4aaace', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#00aeef')}
            onBlur={e => (e.target.style.borderColor = '#dde5ee')}
          />
        </div>

        {/* Widget Turnstile ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div ref={containerRef} />
          {!widgetReady && (
            <div style={{
              fontSize: 12, color: '#aaa', padding: '10px 0',
            }}>
              Chargement de la vérification…
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #ffcccc',
            borderRadius: 8, padding: '10px 14px',
            color: '#cc3333', fontSize: 13, fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !turnstileToken}
          style={{
            width: '100%', padding: '12px', borderRadius: 10,
            background: (loading || !turnstileToken)
              ? '#aaa'
              : 'linear-gradient(135deg, #00c4ff, #0099d6)',
            border: 'none', color: '#fff',
            fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
            cursor: (loading || !turnstileToken) ? 'not-allowed' : 'pointer',
            boxShadow: (loading || !turnstileToken) ? 'none' : '0 4px 14px #00aeef44',
            transition: 'all 0.15s', marginTop: 4,
          }}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </>
  )
}
