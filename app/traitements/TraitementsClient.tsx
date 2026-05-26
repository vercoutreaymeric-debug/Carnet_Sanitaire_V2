'use client'
import { useState } from 'react'
import Card from '@/components/Card'
import Btn from '@/components/Btn'
import Input from '@/components/Input'
import Icon from '@/components/Icon'
import { CanCreate, CanDelete } from '@/components/RoleGate'
import { todayISO } from '@/lib/utils'

interface Bassin { id: number; nom: string }
interface Traitement {
  id: number; date: string; heure: string | null; bassinId: number; bassinNom: string
  quantiteStabilisant: number | null; uniteStabilisant: string | null
  quantiteDesinfectant: number | null; uniteDesinfectant: string | null
  quantiteCorrecteurPh: number | null; uniteCorrecteurPh: string | null
  debitRecyclage: number | null; notes: string | null; createdAt: string
}

const UNITES = ['litre', 'kg', 'galet']
const emptyForm = {
  date: todayISO(), heure: '', bassinId: '', bassinNom: '',
  quantiteStabilisant: '', uniteStabilisant: 'litre',
  quantiteDesinfectant: '', uniteDesinfectant: 'litre',
  quantiteCorrecteurPh: '', uniteCorrecteurPh: 'litre',
  debitRecyclage: '', notes: '',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8,
  padding: '8px 11px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14,
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

export default function TraitementsClient({ initialData, bassins }: { initialData: Traitement[]; bassins: Bassin[] }) {
  const [data, setData] = useState<Traitement[]>(initialData)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm, bassinId: String(bassins[0]?.id ?? ''), bassinNom: bassins[0]?.nom ?? '' })
  const [saving, setSaving] = useState(false)
  const [filterBassin, setFilterBassin] = useState('Tous')

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    const res = await fetch('/api/traitements')
    if (res.ok) setData(await res.json())
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/traitements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { setShowForm(false); setForm({ ...emptyForm, bassinId: String(bassins[0]?.id ?? ''), bassinNom: bassins[0]?.nom ?? '' }); load() }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce traitement ?')) return
    await fetch(`/api/traitements/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = data.filter(t => filterBassin === 'Tous' || t.bassinNom === filterBassin)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Traitements</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Saisie des produits et débits de recyclage</p>
        </div>
        <CanCreate>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            <Icon name="plus" size={16} /> Nouveau traitement
          </button>
        </CanCreate>
      </div>

      {/* Filtre bassin */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['Tous', ...bassins.map(b => b.nom)].map(b => (
          <button key={b} onClick={() => setFilterBassin(b)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: filterBassin === b ? 'var(--accent)' : 'var(--surface2)',
              color: filterBassin === b ? '#fff' : 'var(--text2)' }}>
            {b}
          </button>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card style={{ border: '1px solid var(--accent)44' }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--accent)' }}>Nouveau traitement</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Date *</label>
              <input style={inputStyle} type="date" value={form.date} onChange={e => upd('date', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Heure</label>
              <input style={inputStyle} type="time" value={form.heure} onChange={e => upd('heure', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Bassin *</label>
              <select style={inputStyle} value={form.bassinId} onChange={e => {
                const b = bassins.find(b => b.id === parseInt(e.target.value))
                setForm(f => ({ ...f, bassinId: e.target.value, bassinNom: b?.nom ?? '' }))
              }}>
                {bassins.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
            {/* Stabilisant */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Qté stabilisant</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ ...inputStyle, flex: 1 }} type="number" step="0.1" min="0" placeholder="0" value={form.quantiteStabilisant} onChange={e => upd('quantiteStabilisant', e.target.value)} />
                <select style={{ ...inputStyle, width: 80 }} value={form.uniteStabilisant} onChange={e => upd('uniteStabilisant', e.target.value)}>
                  {UNITES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Désinfectant */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Qté désinfectant *</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ ...inputStyle, flex: 1 }} type="number" step="0.1" min="0" placeholder="0" value={form.quantiteDesinfectant} onChange={e => upd('quantiteDesinfectant', e.target.value)} />
                <select style={{ ...inputStyle, width: 80 }} value={form.uniteDesinfectant} onChange={e => upd('uniteDesinfectant', e.target.value)}>
                  {UNITES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Correcteur pH */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Qté correcteur pH *</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={{ ...inputStyle, flex: 1 }} type="number" step="0.1" min="0" placeholder="0" value={form.quantiteCorrecteurPh} onChange={e => upd('quantiteCorrecteurPh', e.target.value)} />
                <select style={{ ...inputStyle, width: 80 }} value={form.uniteCorrecteurPh} onChange={e => upd('uniteCorrecteurPh', e.target.value)}>
                  {UNITES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Débit recyclage */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Débit recyclage (m³/h)</label>
              <input style={inputStyle} type="number" step="0.1" min="0" placeholder="0" value={form.debitRecyclage} onChange={e => upd('debitRecyclage', e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Notes</label>
            <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={form.notes} onChange={e => upd('notes', e.target.value)} placeholder="Observations..." />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              {saving ? '…' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 14px', fontFamily: 'DM Sans', fontSize: 14, cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </Card>
      )}

      {/* Liste */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Heure</th>
              <th>Bassin</th>
              <th>Stabilisant</th>
              <th>Désinfectant</th>
              <th>Correcteur pH</th>
              <th>Débit (m³/h)</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text3)', padding: '32px 0', fontSize: 14 }}>Aucun traitement enregistré</td></tr>
            ) : filtered.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                <td style={{ color: 'var(--text2)', fontSize: 13 }}>{t.heure || '—'}</td>
                <td style={{ fontWeight: 600 }}>{t.bassinNom}</td>
                <td style={{ fontSize: 13 }}>{t.quantiteStabilisant != null ? `${t.quantiteStabilisant} ${t.uniteStabilisant}` : '—'}</td>
                <td style={{ fontSize: 13 }}>{t.quantiteDesinfectant != null ? `${t.quantiteDesinfectant} ${t.uniteDesinfectant}` : '—'}</td>
                <td style={{ fontSize: 13 }}>{t.quantiteCorrecteurPh != null ? `${t.quantiteCorrecteurPh} ${t.uniteCorrecteurPh}` : '—'}</td>
                <td style={{ fontSize: 13 }}>{t.debitRecyclage ?? '—'}</td>
                <td style={{ color: 'var(--text2)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes || '—'}</td>
                <td>
                  <CanDelete>
                    <button onClick={() => handleDelete(t.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }} title="Supprimer">
                      <Icon name="trash" size={15} />
                    </button>
                  </CanDelete>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
