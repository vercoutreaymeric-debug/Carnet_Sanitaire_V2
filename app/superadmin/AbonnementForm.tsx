'use client'
import { useState } from 'react'

interface Abonnement {
  plan: string
  statut: string
  dateDebut: Date | string
  dateExpiration: Date | string
  maxBassins: number
  maxUtilisateurs: number
  notes: string
}

const PLANS   = ['Starter', 'Pro', 'Intégral', 'Sur-mesure']
const STATUTS = [
  { value: 'actif',    label: '✅ Actif' },
  { value: 'essai',    label: '🕐 Essai' },
  { value: 'suspendu', label: '⏸️ Suspendu' },
  { value: 'expiré',   label: '❌ Expiré' },
]

function toDateInput(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10)
}

export default function AbonnementForm({ current }: { current: Abonnement | null }) {
  const now = new Date()
  const nextYear = new Date(now); nextYear.setFullYear(nextYear.getFullYear() + 1)

  const [form, setForm] = useState({
    plan:             current?.plan            ?? 'Starter',
    statut:           current?.statut          ?? 'essai',
    dateDebut:        toDateInput(current?.dateDebut    ?? now),
    dateExpiration:   toDateInput(current?.dateExpiration ?? nextYear),
    maxBassins:       String(current?.maxBassins      ?? 5),
    maxUtilisateurs:  String(current?.maxUtilisateurs ?? 10),
    notes:            current?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/abonnement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setResult({ ok: true, msg: '✅ Abonnement mis à jour' })
      else { const d = await res.json(); setResult({ ok: false, msg: d.error ?? 'Erreur' }) }
    } catch { setResult({ ok: false, msg: 'Erreur réseau' }) }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--border2)', background: 'var(--surface2)',
    color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>

        <div>
          <label style={lbl}>Plan</label>
          <select value={form.plan} onChange={e => upd('plan', e.target.value)} style={inp}>
            {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label style={lbl}>Statut</label>
          <select value={form.statut} onChange={e => upd('statut', e.target.value)} style={inp}>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label style={lbl}>Date de début</label>
          <input type="date" value={form.dateDebut} onChange={e => upd('dateDebut', e.target.value)} style={inp} />
        </div>

        <div>
          <label style={lbl}>Date d'expiration</label>
          <input type="date" value={form.dateExpiration} onChange={e => upd('dateExpiration', e.target.value)} style={inp} />
        </div>

        <div>
          <label style={lbl}>Max bassins</label>
          <input type="number" min={1} value={form.maxBassins} onChange={e => upd('maxBassins', e.target.value)} style={inp} />
        </div>

        <div>
          <label style={lbl}>Max utilisateurs</label>
          <input type="number" min={1} value={form.maxUtilisateurs} onChange={e => upd('maxUtilisateurs', e.target.value)} style={inp} />
        </div>
      </div>

      <div>
        <label style={lbl}>Notes internes CIFEC</label>
        <textarea value={form.notes} onChange={e => upd('notes', e.target.value)} rows={2}
          placeholder="Informations de facturation, conditions particulières…"
          style={{ ...inp, resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={loading} style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '9px 22px', fontFamily: 'DM Sans',
          fontWeight: 600, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}>
          💾 {loading ? 'Enregistrement…' : 'Enregistrer l\'abonnement'}
        </button>
        {result && (
          <span style={{
            fontSize: 13, padding: '8px 14px', borderRadius: 8,
            background: result.ok ? 'var(--green)18' : 'var(--red)18',
            color: result.ok ? 'var(--green)' : 'var(--red)',
            border: `1px solid ${result.ok ? 'var(--green)44' : 'var(--red)44'}`,
          }}>{result.msg}</span>
        )}
      </div>
    </div>
  )
}
