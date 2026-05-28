'use client'
import { useState, FormEvent, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import HCaptcha from '@hcaptcha/react-hcaptcha'

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''

export default function LoginForm() {
  const searchParams = useSearchParams()
  const [username, setUsername]    = useState('')
  const [password, setPassword]    = useState('')
  const [loading, setLoading]      = useState(false)
  const [error, setError]          = useState('')
  const [captchaToken, setToken]   = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!captchaToken) {
      setError('Veuillez compléter la vérification anti-robot.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, captchaToken }),
    })

    if (res.ok) {
      const from = searchParams.get('from') || '/dashboard'
      window.location.href = from
    } else {
      const data = await res.json()
      setError(data.error || 'Identifiants incorrects')
      setLoading(false)
      // Réinitialise le captcha après chaque échec
      captchaRef.current?.resetCaptcha()
      setToken(null)
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

      {/* hCaptcha — grille d'images anti-robot ──────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {SITE_KEY ? (
          <HCaptcha
            ref={captchaRef}
            sitekey={SITE_KEY}
            onVerify={(token) => setToken(token)}
            onExpire={() => setToken(null)}
            onError={() => setToken(null)}
            languageOverride="fr"
            theme="light"
          />
        ) : (
          <div style={{ fontSize: 12, color: '#aaa', padding: '8px 0' }}>
            CAPTCHA non configuré (NEXT_PUBLIC_HCAPTCHA_SITE_KEY manquant)
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
        disabled={loading || !captchaToken}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: (loading || !captchaToken)
            ? '#aaa'
            : 'linear-gradient(135deg, #00c4ff, #0099d6)',
          border: 'none', color: '#fff',
          fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
          cursor: (loading || !captchaToken) ? 'not-allowed' : 'pointer',
          boxShadow: (loading || !captchaToken) ? 'none' : '0 4px 14px #00aeef44',
          transition: 'all 0.15s', marginTop: 4,
        }}
      >
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
