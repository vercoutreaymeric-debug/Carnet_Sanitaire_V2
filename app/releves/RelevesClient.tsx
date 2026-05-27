'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import Metric from '@/components/Metric'
import Btn from '@/components/Btn'
import Input from '@/components/Input'
import Icon from '@/components/Icon'
import HelpPanel from '@/components/HelpPanel'
import QRScanner from '@/components/QRScanner'
import { CanCreate, CanDeleteReleve, CanValider } from '@/components/RoleGate'
import { useAuth } from '@/contexts/AuthContext'
import { todayISO, computeStatus, getStatusRaisons } from '@/lib/utils'
import { calcChloreActif } from '@/lib/chloreActif'
import type { Releve, Bassin } from '@/types'

interface Props {
  initialReleves: Releve[]
  initialBassins: Bassin[]
}

const emptyForm = {
  bassinId: '', bassinNom: '', heure: '08:30', transparence: 'Bonne',
  pointPrelevement: '',
  tempEau: '', tempAir: '', ph: '', chloreLibre: '', chloreCombine: '',
  chloreTotal: '', turbidite: '', redox: '', cyanurate: '', tauxChlorure: '',
  th: '', tac: '', volumeReactif: '', debitRecyclage: '',
}

export default function RelevesClient({ initialReleves, initialBassins }: Props) {
  const [releves, setReleves] = useState<Releve[]>(initialReleves)
  const [bassins] = useState<Bassin[]>(initialBassins)
  const { user, isControleurARS } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [activeBassin, setActiveBassin] = useState('Tous')
  const [statusFilter, setStatusFilter] = useState<'tous' | 'conforme' | 'attention' | 'nonconforme'>('tous')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [form, setForm] = useState({ ...emptyForm, bassinId: String(bassins[0]?.id ?? ''), bassinNom: bassins[0]?.nom ?? '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const bassinId = searchParams.get('bassinId')
    if (bassinId) {
      const b = bassins.find(x => String(x.id) === bassinId)
      if (b) {
        setForm(f => ({ ...f, bassinId: String(b.id), bassinNom: b.nom }))
        setActiveBassin(b.nom)
        setShowForm(true)
      }
    }
  }, [searchParams, bassins])

  const handleScan = (bassinId: string) => {
    const b = bassins.find(x => String(x.id) === bassinId)
    if (!b) return
    const now = new Date()
    const heure = now.toTimeString().slice(0, 5)
    setForm(f => ({ ...f, bassinId: String(b.id), bassinNom: b.nom, heure }))
    setActiveBassin(b.nom)
    setShowForm(true)
    setShowScanner(false)
  }

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const chloreCombinePreview = form.chloreCombine !== '' ? parseFloat(form.chloreCombine) : null
  const previewStatus = form.ph && form.chloreLibre
    ? computeStatus(parseFloat(form.ph), parseFloat(form.chloreLibre), chloreCombinePreview)
    : null
  const previewRaisons = (form.ph && form.chloreLibre && previewStatus && previewStatus !== 'conforme')
    ? getStatusRaisons(parseFloat(form.ph), parseFloat(form.chloreLibre), chloreCombinePreview)
    : []

  const bassinActif = bassins.find(b => String(b.id) === form.bassinId)
  const pointsBassin: string[] = (() => { try { return JSON.parse(bassinActif?.pointsPrelevement || '[]') } catch { return [] } })()
  const previewChloreActif = (form.chloreLibre && form.ph && form.tempEau)
    ? calcChloreActif(
        parseFloat(form.chloreLibre),
        parseFloat(form.ph),
        parseFloat(form.tempEau),
        (bassinActif?.mineralisationEau ?? 'normale') as 'normale' | 'forte'
      )
    : null

  const handleSave = async () => {
    if (!form.ph || !form.chloreLibre || !form.bassinId) return
    setSaving(true)
    try {
      const res = await fetch('/api/releves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: selectedDate }),
      })
      const newR: Releve = await res.json()
      setReleves(r => [newR, ...r])
      setSaved(true)
      router.refresh()
      setTimeout(() => { setSaved(false); setShowForm(false); setForm({ ...emptyForm, bassinId: String(bassins[0]?.id ?? ''), bassinNom: bassins[0]?.nom ?? '' }); }, 1200)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce relevé ? (action réservée superadmin)')) return
    await fetch(`/api/releves/${id}`, { method: 'DELETE' })
    setReleves(r => r.filter(x => x.id !== id))
    router.refresh()
  }

  const handleValider = async (id: number) => {
    const res = await fetch(`/api/releves/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valideePar: user?.nom || user?.username || 'Gestionnaire' }),
    })
    if (res.ok) {
      const updated: Releve = await res.json()
      setReleves(r => r.map(x => x.id === id ? updated : x))
    }
  }

  // ARS voit uniquement les relevés validés
  const relevesVisibles = isControleurARS ? releves.filter(r => r.valide) : releves

  const filteredByBassin = activeBassin === 'Tous' ? relevesVisibles : relevesVisibles.filter(r => r.bassinNom === activeBassin)
  const filteredByStatus = statusFilter === 'tous' ? filteredByBassin : filteredByBassin.filter(r => r.status === statusFilter)
  const filteredByDate = filteredByStatus.filter(r => r.date === selectedDate)

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8,
    padding: '8px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Relevés journaliers</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Mesures qualité eau — Arrêté du 26 mai 2021</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HelpPanel pageId="releves" />
          <CanCreate>
            <button
              onClick={() => setShowScanner(true)}
              title="Scanner le QR code d'un bassin"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600 }}
            >
              <Icon name="qrcode" size={16} />
              Scanner
            </button>
          </CanCreate>
          <button
            onClick={() => {
              const params = new URLSearchParams()
              params.set('from', selectedDate)
              params.set('to', selectedDate)
              if (activeBassin !== 'Tous') params.set('bassin', activeBassin)
              window.open(`/preview/releves?${params.toString()}`, '_blank')
            }}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600 }}
          >
            <Icon name="download" size={16} />
            PDF du jour
          </button>
          <CanCreate>
            <Btn icon="plus" onClick={() => setShowForm(v => !v)}>{showForm ? 'Annuler' : 'Nouveau relevé'}</Btn>
          </CanCreate>
        </div>
      </div>

      {/* Bandeau ARS */}
      {isControleurARS && (
        <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 10 }}>
          🏛 <span>Accès <strong>Contrôleur ARS</strong> — Affichage des relevés validés uniquement</span>
        </div>
      )}

      {/* Tabs bassins */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', overflowX: 'auto' }}>
        {['Tous', ...bassins.map(b => b.nom)].map(b => {
          const active = activeBassin === b
          const count = b === 'Tous' ? releves.length : releves.filter(r => r.bassinNom === b).length
          return (
            <button key={b} onClick={() => setActiveBassin(b)} style={{
              flex: '1 1 auto', minWidth: 100, padding: '8px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--text2)',
              fontWeight: active ? 600 : 500, fontSize: 13, fontFamily: 'DM Sans',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {b}
              <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'var(--surface3)', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([
          { key: 'tous',        label: 'Tous',          color: 'var(--text2)' },
          { key: 'conforme',    label: '✓ Conforme',    color: 'var(--green)' },
          { key: 'attention',   label: '⚠ Attention',   color: 'var(--orange)' },
          { key: 'nonconforme', label: '✕ Non conforme',color: 'var(--red)' },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${statusFilter === f.key ? f.color : 'var(--border2)'}`,
            background: statusFilter === f.key ? f.color + '18' : 'transparent',
            color: statusFilter === f.key ? f.color : 'var(--text3)',
            cursor: 'pointer', fontFamily: 'DM Sans', transition: 'all 0.15s',
          }}>
            {f.label}
            <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.8 }}>
              ({(f.key === 'tous' ? filteredByBassin : filteredByBassin.filter(r => r.status === f.key)).length})
            </span>
          </button>
        ))}
      </div>

      {/* View toggle + date */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
          {(['cards', 'table'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: viewMode === m ? 'var(--accent)' : 'transparent',
              color: viewMode === m ? '#fff' : 'var(--text2)',
              fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600,
            }}>{m === 'cards' ? 'Cartes (jour)' : 'Historique (tableau)'}</button>
          ))}
        </div>
        {viewMode === 'cards' && (
          <>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={selectStyle} />
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>{filteredByDate.length} relevé(s) ce jour</span>
          </>
        )}
        {viewMode === 'table' && (
          <span style={{ color: 'var(--text3)', fontSize: 13 }}>{filteredByStatus.length} relevé(s) au total</span>
        )}
      </div>

      {/* Form */}
      <CanCreate>
      {showForm && (
        <Card style={{ border: '1px solid var(--accent)44' }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, color: 'var(--accent)' }}>Nouveau relevé — {selectedDate}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Bassin *</label>
              <select style={selectStyle} value={form.bassinId} onChange={e => {
                const b = bassins.find(x => String(x.id) === e.target.value)
                upd('bassinId', e.target.value); upd('bassinNom', b?.nom ?? '')
              }}>
                {bassins.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
              </select>
            </div>
            <Input label="Heure" value={form.heure} onChange={e => upd('heure', e.target.value)} type="time" />
            {pointsBassin.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Point de prélèvement</label>
                <select style={selectStyle} value={form.pointPrelevement} onChange={e => upd('pointPrelevement', e.target.value)}>
                  <option value="">— Non précisé —</option>
                  {pointsBassin.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Transparence</label>
              <select style={selectStyle} value={form.transparence} onChange={e => upd('transparence', e.target.value)}>
                {['Excellente', 'Bonne', 'Moyenne', 'Mauvaise'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <Input label="T° eau" value={form.tempEau} onChange={e => upd('tempEau', e.target.value)} type="number" unit="°C" step={0.1} />
            <Input label="T° air" value={form.tempAir} onChange={e => upd('tempAir', e.target.value)} type="number" unit="°C" step={0.1} />
          </div>

          {/* Chlore, pH, mesures physico-chimiques obligatoires */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0', paddingTop: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Désinfection &amp; pH <span style={{ color: 'var(--red)', marginLeft: 4 }}>*obligatoires</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
              <Input label="pH *" value={form.ph} onChange={e => upd('ph', e.target.value)} type="number" required step={0.01} />
              <Input label="Chlore libre DPD1 *" value={form.chloreLibre} onChange={e => upd('chloreLibre', e.target.value)} type="number" unit="mg/L" required step={0.01} />
              <Input label="Chlore combiné *" value={form.chloreCombine} onChange={e => upd('chloreCombine', e.target.value)} type="number" unit="mg/L" step={0.01} />
              <Input label="Chlore total DPD3" value={form.chloreTotal} onChange={e => upd('chloreTotal', e.target.value)} type="number" unit="mg/L" step={0.01} />
              <Input label="Turbidité *" value={form.turbidite} onChange={e => upd('turbidite', e.target.value)} type="number" unit="NTU" step={0.01} />
              <Input label="Potentiel redox" value={form.redox} onChange={e => upd('redox', e.target.value)} type="number" unit="mV" step={1} />
            </div>
          </div>

          {/* Paramètres équilibre de l'eau */}
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: 16, paddingTop: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Équilibre de l'eau</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
              <Input label="TH" value={form.th} onChange={e => upd('th', e.target.value)} type="number" unit="°f" step={0.1} />
              <Input label="TAC" value={form.tac} onChange={e => upd('tac', e.target.value)} type="number" unit="°f" step={0.1} />
              {/* Cyanurate — affiché si traitement Chlore + bassin plein air */}
              {(bassins.find(b => String(b.id) === form.bassinId)?.traitementPrincipal === 'Chlore' &&
                bassins.find(b => String(b.id) === form.bassinId)?.type === 'pleinair') && (
                <Input label="Cyanurate" value={form.cyanurate} onChange={e => upd('cyanurate', e.target.value)} type="number" unit="mg/L" step={1} />
              )}
              {/* Taux de chlorure — affiché si traitement Sel/Électrolyse */}
              {bassins.find(b => String(b.id) === form.bassinId)?.traitementPrincipal === 'Sel/Électrolyse' && (
                <Input label="Taux chlorure" value={form.tauxChlorure} onChange={e => upd('tauxChlorure', e.target.value)} type="number" unit="mg/L" step={10} />
              )}
            </div>
          </div>

          {/* Exploitation */}
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: 16, paddingTop: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Exploitation</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
              <Input label="Vol. réactif" value={form.volumeReactif} onChange={e => upd('volumeReactif', e.target.value)} type="number" unit="L" step={0.1} />
              <Input label="Débit recyclage" value={form.debitRecyclage} onChange={e => upd('debitRecyclage', e.target.value)} type="number" unit="m³/h" step={0.1} />
            </div>
          </div>

          {/* ── Notice critères de conformité ─────────────────────────── */}
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', userSelect: 'none', fontWeight: 500 }}>
              ℹ️ Critères de conformité (Arrêté du 7 avril 1981)
            </summary>
            <div style={{ background: 'var(--surface3)', borderRadius: 8, padding: '10px 14px', marginTop: 6, fontSize: 12, color: 'var(--text2)' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', paddingBottom: 4, fontWeight: 600 }}>Paramètre</th>
                    <th style={{ textAlign: 'center', color: 'var(--green)', paddingBottom: 4 }}>✅ Conforme</th>
                    <th style={{ textAlign: 'center', color: 'var(--orange)', paddingBottom: 4 }}>⚠️ Attention</th>
                    <th style={{ textAlign: 'center', color: 'var(--red)', paddingBottom: 4 }}>❌ Non conforme</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['pH',           '7,1 – 7,6',     '7,0–7,1 ou 7,6–7,8', '< 7,0 ou > 7,8'],
                    ['Chlore libre', '≥ 0,5 mg/L',    '0,4 – 0,5 mg/L',     '< 0,4 ou > 1,4 mg/L'],
                    ['Chlore combiné','≤ 0,6 mg/L',   '0,6 – 0,8 mg/L',     '> 0,8 mg/L'],
                  ].map(([param, ok, warn, bad]) => (
                    <tr key={param} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '4px 0', fontWeight: 500 }}>{param}</td>
                      <td style={{ textAlign: 'center', color: 'var(--green)' }}>{ok}</td>
                      <td style={{ textAlign: 'center', color: 'var(--orange)' }}>{warn}</td>
                      <td style={{ textAlign: 'center', color: 'var(--red)' }}>{bad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* ── Encart statut + chlore actif ──────────────────────────── */}
          <div style={{ background: 'var(--surface3)', borderRadius: 8, padding: '10px 14px', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {previewStatus ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Statut estimé :</span>
                  <Badge status={previewStatus} small />
                </div>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Renseignez pH + Chlore libre pour voir le statut</span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Chlore libre actif :</span>
                {previewChloreActif !== null ? (
                  <>
                    <span style={{
                      fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13,
                      color: previewChloreActif >= 0.4 ? 'var(--green)' : previewChloreActif >= 0.2 ? 'var(--orange)' : 'var(--red)',
                    }}>{previewChloreActif} mg/L</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>(min. ≥ 0,4)</span>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>— renseignez pH, Cl libre et T° eau</span>
                )}
              </div>
            </div>
            {/* Raisons de non-conformité ou d'attention */}
            {previewRaisons.length > 0 && (
              <div style={{
                background: previewStatus === 'nonconforme' ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
                border: `1px solid ${previewStatus === 'nonconforme' ? 'var(--red)' : 'var(--orange)'}`,
                borderRadius: 6, padding: '6px 10px',
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: previewStatus === 'nonconforme' ? 'var(--red)' : 'var(--orange)', marginBottom: 4 }}>
                  {previewStatus === 'nonconforme' ? '❌ Valeur(s) hors norme :' : '⚠️ Valeur(s) à surveiller :'}
                </p>
                {previewRaisons.map((r, i) => (
                  <p key={i} style={{ fontSize: 11, color: 'var(--text2)', margin: 0 }}>• {r}</p>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Btn icon="save" onClick={handleSave} disabled={saving || !form.ph || !form.chloreLibre}>
              {saved ? '✓ Enregistré' : saving ? 'Enregistrement…' : 'Enregistrer'}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Annuler</Btn>
          </div>
        </Card>
      )}
      </CanCreate>

      {/* Table view */}
      {viewMode === 'table' ? (
        filteredByStatus.length === 0 ? (
          <Card><div className="empty-state"><Icon name="water" size={32} color="var(--text3)" /><p>Aucun relevé enregistré</p></div></Card>
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {['Date', 'Heure', 'Bassin', 'Point', 'pH', 'Cl libre', 'Cl actif', 'Cl combiné', 'T° eau', 'TH', 'TAC', 'Statut', 'Validation', ''].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredByStatus].sort((a, b) => (b.date + b.heure).localeCompare(a.date + a.heure)).map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'DM Mono' }}>{r.date}</td>
                      <td style={{ fontFamily: 'DM Mono', color: 'var(--text2)' }}>{r.heure}</td>
                      <td style={{ fontWeight: 600 }}>{r.bassinNom}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--accent)' }}>{r.pointPrelevement || '—'}</td>
                      <td style={{ fontFamily: 'DM Mono', color: r.ph >= 7.1 && r.ph <= 7.6 ? 'var(--green)' : r.ph <= 7.8 ? 'var(--orange)' : 'var(--red)' }}>{r.ph}</td>
                      <td style={{ fontFamily: 'DM Mono', color: r.chloreLibre >= 0.4 && r.chloreLibre <= 1.4 ? 'var(--green)' : 'var(--red)' }}>{r.chloreLibre}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: r.chloreActif != null ? (r.chloreActif >= 0.4 ? 'var(--green)' : r.chloreActif >= 0.2 ? 'var(--orange)' : 'var(--red)') : 'var(--text3)' }}>
                        {r.chloreActif != null ? `${r.chloreActif}` : '—'}
                      </td>
                      <td style={{ fontFamily: 'DM Mono', color: (r.chloreCombine ?? 0) < 0.6 ? 'var(--green)' : (r.chloreCombine ?? 0) < 0.8 ? 'var(--orange)' : 'var(--red)' }}>{r.chloreCombine ?? '—'}</td>
                      <td style={{ fontFamily: 'DM Mono' }}>{r.tempEau}°</td>
                      <td style={{ fontFamily: 'DM Mono' }}>{r.th ?? '—'}</td>
                      <td style={{ fontFamily: 'DM Mono' }}>{r.tac ?? '—'}</td>
                      <td><Badge status={r.status} small /></td>
                      <td>
                        {r.valide ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#065f46', background: '#d1fae5', padding: '2px 8px', borderRadius: 10 }}>✅ Validé</span>
                        ) : (
                          <CanValider>
                            <button onClick={() => handleValider(r.id)} style={{ fontSize: 11, fontWeight: 700, color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                              ✓ Valider
                            </button>
                          </CanValider>
                        )}
                      </td>
                      <td>
                        <CanDeleteReleve>
                          <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }} title="Supprimer">
                            <Icon name="trash" size={14} />
                          </button>
                        </CanDeleteReleve>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        /* Cards view */
        filteredByDate.length === 0 ? (
          <Card>
            <div className="empty-state">
              <Icon name="water" size={32} color="var(--text3)" />
              <p>Aucun relevé pour cette date</p>
              <CanCreate>
                <Btn icon="plus" onClick={() => setShowForm(true)}>Ajouter un relevé</Btn>
              </CanCreate>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredByDate.map(r => (
              <Card key={r.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{r.bassinNom}</span>
                    <span style={{ color: 'var(--text3)', fontSize: 13, marginLeft: 8 }}>
                      {r.heure}
                      {r.pointPrelevement && <span style={{ marginLeft: 6, fontWeight: 600, color: 'var(--accent)' }}>· Pt {r.pointPrelevement}</span>}
                      {' '}— {r.transparence}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge status={r.status} />
                    {r.valide ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '3px 10px', borderRadius: 20 }}>✅ Validé</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e', background: '#fef9c3', border: '1px solid #fde047', padding: '3px 10px', borderRadius: 20 }}>⏳ En attente</span>
                    )}
                    <CanValider>
                      {!r.valide && (
                        <button onClick={() => handleValider(r.id)} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#10b981', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>
                          ✓ Valider
                        </button>
                      )}
                    </CanValider>
                    <CanDeleteReleve>
                      <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }} title="Supprimer">
                        <Icon name="trash" size={15} />
                      </button>
                    </CanDeleteReleve>
                  </div>
                </div>
                <div className="metrics-grid">
                  <Metric label="pH" value={r.ph} status={r.ph >= 7.1 && r.ph <= 7.6 ? 'ok' : r.ph <= 7.8 ? 'warn' : 'bad'} />
                  <Metric label="T° eau" value={r.tempEau} unit="°C" />
                  <Metric label="T° air" value={r.tempAir} unit="°C" />
                  <Metric label="Cl libre" value={r.chloreLibre} unit="mg/L" status={r.chloreLibre >= 0.4 && r.chloreLibre <= 1.4 ? 'ok' : 'bad'} />
                  <Metric label="Cl combiné" value={r.chloreCombine} unit="mg/L" status={(r.chloreCombine ?? 0) < 0.6 ? 'ok' : (r.chloreCombine ?? 0) < 0.8 ? 'warn' : 'bad'} />
                  <Metric label="Cl total" value={r.chloreTotal} unit="mg/L" />
                  <Metric label="Turbidité" value={r.turbidite} unit="NTU" status={r.turbidite !== null ? (r.turbidite <= 0.5 ? 'ok' : r.turbidite <= 1 ? 'warn' : 'bad') : undefined} />
                  {r.redox !== null && <Metric label="Redox" value={r.redox} unit="mV" status={r.redox >= 650 ? 'ok' : r.redox >= 600 ? 'warn' : 'bad'} />}
                  <Metric label="TH" value={r.th} unit="°f" status={(r.th ?? 0) >= 10 ? 'ok' : 'warn'} />
                  <Metric label="TAC" value={r.tac} unit="°f" status={(r.tac ?? 0) >= 9 ? 'ok' : 'warn'} />
                  {r.cyanurate !== null && <Metric label="Cyanurate" value={r.cyanurate} unit="mg/L" status={(r.cyanurate ?? 0) <= 75 ? 'ok' : 'bad'} />}
                  {r.tauxChlorure !== null && <Metric label="Chlorure" value={r.tauxChlorure} unit="mg/L" />}
                  <Metric label="Vol. réactif" value={r.volumeReactif} unit="L" />
                  <Metric label="Débit recyclage" value={r.debitRecyclage} unit="m³/h" />
                  {r.chloreActif !== null && r.chloreActif !== undefined && (
                    <Metric label="Cl actif" value={r.chloreActif} unit="mg/L"
                      status={r.chloreActif >= 0.4 ? 'ok' : r.chloreActif >= 0.2 ? 'warn' : 'bad'} />
                  )}
                </div>
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="info" size={12} color="var(--text3)" />
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Transparence : {r.transparence}</span>
                  {r.valide && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}>
                      🔒 Validé par {r.valideePar}{r.valideeAt ? ` à ${new Date(r.valideeAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''} — <em>Document officiel</em>
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}
      {showScanner && (
        <QRScanner onResult={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
