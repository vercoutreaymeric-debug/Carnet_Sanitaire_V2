'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import Btn from '@/components/Btn'
import Input from '@/components/Input'
import Icon from '@/components/Icon'
import HelpPanel from '@/components/HelpPanel'
import { CanCreate, CanEdit, CanDelete } from '@/components/RoleGate'
import { useAuth } from '@/contexts/AuthContext'
import { todayISO } from '@/lib/utils'
import type { Intervention } from '@/types'
import PiecesJointes from '@/components/PiecesJointes'

interface Props {
  initialData: Intervention[]
  bassins: string[]
}

const TYPES = ['Tous', 'Incident', 'Maintenance', 'Observation', 'Vérification']
const typeColors: Record<string, string> = {
  Incident: 'var(--orange)', Maintenance: 'var(--accent)', Observation: 'var(--text2)', Vérification: 'var(--green)',
}

const emptyForm = { date: todayISO(), heure: '', type: 'Incident', bassin: '', description: '', agent: '' }

export default function InterventionsClient({ initialData, bassins }: Props) {
  const { canEdit } = useAuth()
  const [data, setData] = useState<Intervention[]>(initialData)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('Tous')
  const [filterBassin, setFilterBassin] = useState('Tous')
  const [form, setForm] = useState({ ...emptyForm, bassin: bassins[0] ?? 'Grand bassin' })
  const [saving, setSaving] = useState(false)
  const [expandedPJ, setExpandedPJ] = useState<number | null>(null)
  const router = useRouter()

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const bassinOptions = ['Tous', ...bassins, 'Tous bassins', 'Hors bassins']

  const filtered = data.filter(i =>
    (filterType === 'Tous' || i.type === filterType) &&
    (filterBassin === 'Tous' || i.bassin === filterBassin)
  )

  const handleSave = async () => {
    if (!form.description) return
    setSaving(true)
    try {
      const res = await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const newI: Intervention = await res.json()
      setData(d => [newI, ...d])
      setShowForm(false)
      setForm({ ...emptyForm, bassin: bassins[0] ?? 'Grand bassin' })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    const res = await fetch(`/api/interventions/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    const updated: Intervention = await res.json()
    setData(d => d.map(x => x.id === id ? updated : x))
    router.refresh()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/interventions/${id}`, { method: 'DELETE' })
    setData(d => d.filter(x => x.id !== id))
    router.refresh()
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8,
    padding: '8px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Interventions & incidents</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Selon l'article 4 de l'arrêté du 26/05/2021 (NOR:SSAP2004757A)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HelpPanel pageId="interventions" />
          <button onClick={() => window.open('/preview/interventions', '_blank')} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600 }}>
            <Icon name="download" size={16} />PDF
          </button>
          <CanCreate>
            <Btn icon="plus" onClick={() => setShowForm(v => !v)}>{showForm ? 'Annuler' : 'Nouvelle intervention'}</Btn>
          </CanCreate>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: filterType === t ? 'var(--accent)' : 'transparent',
              color: filterType === t ? '#fff' : 'var(--text2)',
              fontSize: 12, fontWeight: 600, fontFamily: 'DM Sans',
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Bassin :</label>
          <select value={filterBassin} onChange={e => setFilterBassin(e.target.value)} style={{ ...selectStyle, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {bassinOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Form */}
      <CanCreate>
      {showForm && (
        <Card style={{ border: '1px solid var(--orange)44' }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: 'var(--orange)' }}>Nouvelle intervention</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
            <Input label="Date" value={form.date} onChange={e => upd('date', e.target.value)} type="date" />
            <Input label="Heure" value={form.heure} onChange={e => upd('heure', e.target.value)} type="time" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Type</label>
              <select value={form.type} onChange={e => upd('type', e.target.value)} style={selectStyle}>
                {TYPES.slice(1).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Bassin</label>
              <select value={form.bassin} onChange={e => upd('bassin', e.target.value)} style={selectStyle}>
                {[...bassins, 'Tous bassins', 'Hors bassins'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <Input label="Agent" value={form.agent} onChange={e => upd('agent', e.target.value)} style={{ gridColumn: 'span 2' }} />
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Description / mesures prises *</label>
            <textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={4}
              placeholder="Décrivez l'intervention, les mesures prises et les résultats…"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border2)')}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn icon="save" onClick={handleSave} disabled={saving || !form.description}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Annuler</Btn>
          </div>
        </Card>
      )}
      </CanCreate>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card><div className="empty-state"><Icon name="wrench" size={32} color="var(--text3)" /><p>Aucune intervention pour ce filtre</p></div></Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Date', 'Type', 'Bassin', 'Description', 'Agent', 'Statut', '📎', ''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(iv => (
                  <>
                  <tr key={iv.id}>
                    <td style={{ fontFamily: 'DM Mono', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{iv.date}{iv.heure ? ` ${iv.heure}` : ''}</td>
                    <td>
                      <span style={{ fontSize: 11, background: (typeColors[iv.type] ?? 'var(--accent)') + '22', color: typeColors[iv.type] ?? 'var(--accent)', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                        {iv.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{iv.bassin}</td>
                    <td style={{ color: 'var(--text2)', maxWidth: 320 }}>{iv.description}</td>
                    <td style={{ color: 'var(--text3)' }}>{iv.agent ?? '—'}</td>
                    <td>
                      {canEdit ? (
                        <select
                          value={iv.status}
                          onChange={e => handleStatusChange(iv.id, e.target.value)}
                          style={{ background: 'transparent', border: 'none', fontSize: 12, cursor: 'pointer', color: iv.status === 'résolu' || iv.status === 'clôturé' ? 'var(--green)' : 'var(--orange)', fontWeight: 600, fontFamily: 'DM Sans' }}
                        >
                          {['en cours', 'résolu', 'clôturé'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 600, color: iv.status === 'résolu' || iv.status === 'clôturé' ? 'var(--green)' : 'var(--orange)' }}>
                          {iv.status}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => setExpandedPJ(expandedPJ === iv.id ? null : iv.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, opacity: expandedPJ === iv.id ? 1 : 0.5 }}
                        title="Pièces jointes"
                      >📎</button>
                    </td>
                    <td>
                      <CanDelete>
                        <button onClick={() => handleDelete(iv.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }} title="Supprimer">
                          <Icon name="trash" size={14} />
                        </button>
                      </CanDelete>
                    </td>
                  </tr>
                  {expandedPJ === iv.id && (
                    <tr key={`pj-${iv.id}`}>
                      <td colSpan={8} style={{ background: 'var(--surface2)', padding: '12px 20px' }}>
                        <PiecesJointes module="intervention" moduleId={iv.id} canEdit={canEdit} />
                      </td>
                    </tr>
                  )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
