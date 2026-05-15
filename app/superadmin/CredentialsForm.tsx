'use client'
import { useState } from 'react'

export default function CredentialsForm({ currentUsername }: { currentUsername: string }) {
  const [newUsername, setNewUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)

    if (newPassword && newPassword !== confirmPassword) {
      setResult({ ok: false, message: 'Les nouveaux mots de passe ne correspondent pas' })
      return
    }
    if (newPassword && newPassword.length < 8) {
      setResult({ ok: false, message: 'Le nouveau mot de passe doit faire au moins 8 caractères' })
      return
    }
    if (!newUsername && !newPassword) {
      setResult({ ok: false, message: 'Renseignez au moins un champ à modifier' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? 'Erreur inconnue' })
      } else {
        setResult({ ok: true, message: `✅ Identifiants mis à jour. Nouvel identifiant : ${data.username}` })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setNewUsername('')
      }
    } catch {
      setResult({ ok: false, message: 'Erreur réseau' })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border2)', background: 'var(--surface2)',
    color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: 'var(--text2)', marginBottom: 6,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Identifiant actuel (info) */}
      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>
        Identifiant actuel : <strong style={{ color: 'var(--text)' }}>{currentUsername}</strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Nouvel identifiant */}
        <div>
          <label style={labelStyle}>Nouvel identifiant <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(laisser vide pour ne pas changer)</span></label>
          <input
            type="text"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            placeholder={currentUsername}
            autoComplete="username"
            style={inputStyle}
          />
        </div>

        {/* Mot de passe actuel */}
        <div>
          <label style={labelStyle}>Mot de passe actuel <span style={{ color: 'var(--red)', fontWeight: 700 }}>*</span></label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            style={inputStyle}
          />
        </div>

        {/* Nouveau mot de passe */}
        <div>
          <label style={labelStyle}>Nouveau mot de passe <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(laisser vide pour ne pas changer)</span></label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="8 caractères minimum"
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>

        {/* Confirmation */}
        <div>
          <label style={labelStyle}>Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={loading || !currentPassword}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '9px 20px', fontFamily: 'DM Sans',
            fontWeight: 600, fontSize: 13, cursor: loading || !currentPassword ? 'not-allowed' : 'pointer',
            opacity: loading || !currentPassword ? 0.6 : 1,
          }}
        >
          🔑 {loading ? 'Mise à jour…' : 'Mettre à jour les identifiants'}
        </button>

        {result && (
          <span style={{
            fontSize: 13, padding: '8px 14px', borderRadius: 8,
            background: result.ok ? 'var(--green)18' : 'var(--red)18',
            color: result.ok ? 'var(--green)' : 'var(--red)',
            border: `1px solid ${result.ok ? 'var(--green)44' : 'var(--red)44'}`,
          }}>
            {result.message}
          </span>
        )}
      </div>
    </form>
  )
}
