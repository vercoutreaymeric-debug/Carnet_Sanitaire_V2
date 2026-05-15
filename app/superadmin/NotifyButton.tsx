'use client'
import { useState } from 'react'

export default function NotifyButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    try {
      const res  = await fetch('/api/notify/manual', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setIsError(true)
        setResult(data.error ?? 'Erreur inconnue')
      } else if (data.sent) {
        setIsError(false)
        setResult(`✅ ${data.emails} email(s) envoyé(s) avec succès`)
      } else {
        setIsError(false)
        setResult(`ℹ️ ${data.reason}`)
      }
    } catch (err) {
      setIsError(true)
      setResult(`Erreur réseau : ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#f59e0b', color: '#fff', border: 'none',
          borderRadius: 8, padding: '9px 18px', fontFamily: 'DM Sans',
          fontWeight: 600, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        🔔 {loading ? 'Envoi en cours…' : 'Tester les notifications maintenant'}
      </button>

      {result && (
        <span style={{
          fontSize: 13, padding: '8px 14px', borderRadius: 8,
          background: isError ? 'var(--red)18' : 'var(--green)18',
          color: isError ? 'var(--red)' : 'var(--green)',
          border: `1px solid ${isError ? 'var(--red)44' : 'var(--green)44'}`,
        }}>
          {result}
        </span>
      )}
    </div>
  )
}
