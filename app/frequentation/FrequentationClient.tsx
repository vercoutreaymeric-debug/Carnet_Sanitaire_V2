'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Metric from '@/components/Metric'
import Btn from '@/components/Btn'
import Input from '@/components/Input'
import Icon from '@/components/Icon'
import HelpPanel from '@/components/HelpPanel'
import { CanCreate, CanDelete } from '@/components/RoleGate'
import { todayISO } from '@/lib/utils'
import type { Frequentation } from '@/types'

interface Props { initialData: Frequentation[] }

const emptyForm = { date: todayISO(), scolaire: '', club: '', publicCount: '', reportEau: '', releveEau: '' }

export default function FrequentationClient({ initialData }: Props) {
  const [data, setData] = useState<Frequentation[]>(initialData)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filterMode, setFilterMode] = useState<'all' | 'date' | 'range'>('all')
  const [filterDate, setFilterDate] = useState(todayISO())
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const total = (parseInt(form.scolaire) || 0) + (parseInt(form.club) || 0) + (parseInt(form.publicCount) || 0)
  const totalEau = (parseFloat(form.releveEau) || 0) - (parseFloat(form.reportEau) || 0)
  const litresPrev = total > 0 && totalEau > 0 ? Math.round((totalEau / total) * 1000 * 10) / 10 : null

  const filtered = data.filter(f => {
    if (filterMode === 'date') return f.date === filterDate
    if (filterMode === 'range') return (!filterStart || f.date >= filterStart) && (!filterEnd || f.date <= filterEnd)
    return true
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/frequentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, publicCount: form.publicCount }),
      })
      const newF: Frequentation = await res.json()
      setData(d => [newF, ...d])
      setShowForm(false)
      setForm(emptyForm)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/frequentation/${id}`, { method: 'DELETE' })
    setData(d => d.filter(x => x.id !== id))
    router.refresh()
  }

  const inputDate: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '8px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none',
  }
  const filterBtn = (mode: 'all' | 'date' | 'range', label: string) => (
    <button onClick={() => setFilterMode(mode)} style={{
      padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
      background: filterMode === mode ? 'var(--accent)' : 'transparent',
      color: filterMode === mode ? '#fff' : 'var(--text2)',
      fontSize: 12, fontWeight: 600, fontFamily: 'DM Sans',
    }}>{label}</button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Fréquentation</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Nombre de baigneurs et apport en eau de renouvellement</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HelpPanel pageId="frequentation" />
          <button onClick={() => window.open('/preview/frequentation', '_blank')} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600 }}>
            <Icon name="download" size={16} />PDF
          </button>
          <CanCreate>
            <Btn icon="plus" onClick={() => setShowForm(v => !v)}>{showForm ? 'Annuler' : 'Nouveau relevé'}</Btn>
          </CanCreate>
        </div>
      </div>

      <CanCreate>
      {showForm && (
        <Card style={{ border: '1px solid var(--accent)44' }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: 'var(--accent)' }}>Relevé de fréquentation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
            <Input label="Date" value={form.date} onChange={e => upd('date', e.target.value)} type="date" />
            <Input label="Scolaire" value={form.scolaire} onChange={e => upd('scolaire', e.target.value)} type="number" unit="pers." />
            <Input label="Club" value={form.club} onChange={e => upd('club', e.target.value)} type="number" unit="pers." />
            <Input label="Public" value={form.publicCount} onChange={e => upd('publicCount', e.target.value)} type="number" unit="pers." />
          </div>
          {total > 0 && (
            <div style={{ margin: '12px 0 4px', padding: '10px 14px', background: 'var(--surface3)', borderRadius: 8 }}>
              <span style={{ color: 'var(--text2)', fontSize: 12 }}>Total estimé : </span>
              <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{total} baigneurs</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0', paddingTop: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Apport en eau neuve</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
              <Input label="Report de la veille" value={form.reportEau} onChange={e => upd('reportEau', e.target.value)} type="number" unit="m³" step={0.1} />
              <Input label="Relevé du jour" value={form.releveEau} onChange={e => upd('releveEau', e.target.value)} type="number" unit="m³" step={0.1} />
            </div>
            {litresPrev !== null && total > 0 && (
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 8,
                background: litresPrev >= 30 ? 'var(--green)18' : 'var(--orange)18',
                border: `1px solid ${litresPrev >= 30 ? 'var(--green)' : 'var(--orange)'}44`,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Volume par baigneur : </span>
                <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{litresPrev} L/baigneur</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>(min. réglementaire : 30 L/baigneur)</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn icon="save" onClick={handleSave} disabled={saving || total === 0}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Annuler</Btn>
          </div>
        </Card>
      )}
      </CanCreate>

      {/* Filtres */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          {filterBtn('all', 'Tout')}
          {filterBtn('date', 'Date précise')}
          {filterBtn('range', 'Période')}
        </div>
        {filterMode === 'date' && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={inputDate} />}
        {filterMode === 'range' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Du</span>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} style={inputDate} />
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>au</span>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} style={inputDate} />
          </div>
        )}
        <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>{filtered.length} relevé{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <Card><div className="empty-state"><Icon name="people" size={32} color="var(--text3)" /><p>Aucun relevé pour ce filtre</p></div></Card>
        ) : filtered.map(f => (
          <Card key={f.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{f.date}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'DM Mono', fontSize: 24, color: 'var(--accent)', fontWeight: 500 }}>
                  {f.total} <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Sans' }}>baigneurs</span>
                </span>
                <CanDelete>
                  <button onClick={() => handleDelete(f.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }} title="Supprimer">
                    <Icon name="trash" size={14} />
                  </button>
                </CanDelete>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 14 }}>
              <Metric label="Scolaire" value={f.scolaire} />
              <Metric label="Club" value={f.club} />
              <Metric label="Public" value={f.publicCount} />
              {f.totalEau !== null && <Metric label="Eau ajoutée" value={f.totalEau} unit="m³" />}
              {f.litresParBaigneur !== null && (
                <Metric label="L / baigneur" value={f.litresParBaigneur} unit="L" status={(f.litresParBaigneur ?? 0) >= 30 ? 'ok' : 'warn'} />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
