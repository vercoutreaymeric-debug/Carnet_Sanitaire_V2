'use client'
import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      const from = searchParams.get('from') || '/dashboard'
      window.location.href = from
    } else {
      const data = await res.json()
      setError(data.error || 'Identifiants incorrects')
      setLoading(false)
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
        disabled={loading}
        style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: loading ? '#aaa' : 'linear-gradient(135deg, #00c4ff, #0099d6)',
          border: 'none', color: '#fff',
          fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 14px #00aeef44',
          transition: 'all 0.15s', marginTop: 4,
        }}
      >
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
