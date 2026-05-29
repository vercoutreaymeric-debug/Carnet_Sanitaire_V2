'use client'
import { useState, useEffect, useRef } from 'react'

export interface ConfirmDeleteConfig {
  /** Titre de l'élément supprimé, ex : "Piscine Massy" */
  nom: string
  /** Type d'élément, ex : "établissement", "utilisateur", "organisme" */
  type: string
  /** Niveau de danger : 1 = faible, 2 = moyen, 3 = élevé */
  danger?: 1 | 2 | 3
  /** Détail des données impactées */
  details?: string[]
  /** Callback appelé si la confirmation est validée */
  onConfirm: () => void | Promise<void>
  /** Callback annulation */
  onCancel: () => void
}

const DANGER_CONFIG = {
  1: { label: 'Faible',  color: '#f59e0b', bars: 1, icon: '⚠️' },
  2: { label: 'Moyen',   color: '#f97316', bars: 2, icon: '🔶' },
  3: { label: 'Élevé',   color: '#ef4444', bars: 3, icon: '🚨' },
}

export default function ConfirmDeleteModal({
  nom, type, danger = 3, details = [], onConfirm, onCancel,
}: ConfirmDeleteConfig) {
  const [password, setPassword]       = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [pwStrength, setPwStrength]   = useState<'idle' | 'ok' | 'wrong'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const dc = DANGER_CONFIG[danger]

  useEffect(() => { inputRef.current?.focus() }, [])

  // Vérifie le mot de passe à la volée (debounce 400ms)
  useEffect(() => {
    if (password.length < 3) { setPwStrength('idle'); return }
    const t = setTimeout(async () => {
      try {
        const r = await fetch('/api/auth/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const d = await r.json()
        setPwStrength(d.valid ? 'ok' : 'wrong')
      } catch { setPwStrength('idle') }
    }, 400)
    return () => clearTimeout(t)
  }, [password])

  async function handleConfirm() {
    if (pwStrength !== 'ok') { setError('Mot de passe incorrect.'); return }
    setLoading(true); setError('')
    try { await onConfirm() }
    catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  const borderColor = pwStrength === 'ok' ? '#10b981' : pwStrength === 'wrong' ? '#ef4444' : 'var(--border)'

  return (
    <>
      {/* Overlay */}
      <div onClick={onCancel} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        zIndex: 9998, animation: 'fadeIn 0.15s ease',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 9999, width: '100%', maxWidth: 480,
        background: 'var(--card)', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        border: `2px solid ${dc.color}44`,
        animation: 'slideUp 0.2s ease',
      }}>

        {/* Bande danger en haut */}
        <div style={{ background: `linear-gradient(90deg, ${dc.color}dd, ${dc.color}88)`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{dc.icon}</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Confirmation de suppression</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Cette action est <strong>irréversible</strong></p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Niveau de risque</p>
            <div style={{ display: 'flex', gap: 3 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 24, height: 8, borderRadius: 4,
                  background: i <= dc.bars ? '#fff' : 'rgba(255,255,255,0.3)',
                }} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{dc.label}</p>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '20px 24px' }}>
          {/* Ce qui sera supprimé */}
          <div style={{ background: `${dc.color}11`, border: `1px solid ${dc.color}33`, borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
              Vous êtes sur le point de supprimer définitivement :
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: dc.color }}>
              {type} — {nom}
            </p>
            {details.length > 0 && (
              <ul style={{ marginTop: 8, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {details.map((d, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--text2)' }}>{d}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Champ mot de passe */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
              🔑 Entrez votre mot de passe pour confirmer
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                placeholder="Mot de passe CIFEC"
                style={{
                  width: '100%', padding: '10px 44px 10px 14px', borderRadius: 9,
                  border: `2px solid ${borderColor}`,
                  background: 'var(--surface)', color: 'var(--text)', fontSize: 14,
                  boxSizing: 'border-box', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <button onClick={() => setShowPw(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.6,
              }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Indicateur visuel */}
            <div style={{ marginTop: 6, height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, transition: 'all 0.3s ease',
                width: pwStrength === 'idle' ? '0%' : '100%',
                background: pwStrength === 'ok' ? '#10b981' : pwStrength === 'wrong' ? '#ef4444' : 'transparent',
              }} />
            </div>
            <p style={{ fontSize: 11, marginTop: 4, color: pwStrength === 'ok' ? '#10b981' : pwStrength === 'wrong' ? '#ef4444' : 'var(--text3)', minHeight: 16 }}>
              {pwStrength === 'ok' && '✓ Mot de passe correct'}
              {pwStrength === 'wrong' && '✗ Mot de passe incorrect'}
              {pwStrength === 'idle' && password.length > 0 && '…vérification'}
            </p>

            {error && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>{error}</p>
            )}
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleConfirm}
              disabled={loading || pwStrength !== 'ok'}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 9, border: 'none',
                background: pwStrength === 'ok' ? dc.color : 'var(--border)',
                color: pwStrength === 'ok' ? '#fff' : 'var(--text3)',
                fontWeight: 700, fontSize: 14, cursor: pwStrength === 'ok' ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '⏳ Suppression…' : `🗑️ Supprimer définitivement`}
            </button>
            <button onClick={onCancel} style={{
              padding: '11px 20px', borderRadius: 9, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text2)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              Annuler
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translate(-50%,-46%); opacity: 0 } to { transform: translate(-50%,-50%); opacity: 1 } }
      `}</style>
    </>
  )
}
