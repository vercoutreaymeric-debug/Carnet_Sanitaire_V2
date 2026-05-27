'use client'
import { useState } from 'react'

export default function RecalculButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ total: number; updated: number } | null>(null)
  const [error, setError] = useState('')

  const run = async () => {
    if (!confirm('Recalculer le statut de tous les relevés existants avec les seuils réglementaires à jour ?')) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/admin/recalcul-statuts', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button
        onClick={run}
        disabled={loading}
        style={{
          padding: '8px 18px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? 'var(--surface2)' : '#9333ea', color: loading ? 'var(--text3)' : '#fff',
          fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, width: 'fit-content',
        }}
      >
        {loading ? '⏳ Recalcul en cours…' : '🔄 Recalculer tous les statuts'}
      </button>
      {result && (
        <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>
          ✅ {result.updated} relevé(s) mis à jour sur {result.total} au total.
        </p>
      )}
      {error && <p style={{ fontSize: 13, color: 'var(--red)' }}>❌ {error}</p>}
    </div>
  )
}
