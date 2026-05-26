'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/Card'
import Metric from '@/components/Metric'
import Btn from '@/components/Btn'
import Input from '@/components/Input'
import Icon from '@/components/Icon'
import HelpPanel from '@/components/HelpPanel'
import QRModal from '@/components/QRModal'
import { CanManageConfig, CanDelete } from '@/components/RoleGate'
import type { Bassin } from '@/types'

interface Props { initialData: Bassin[] }

const emptyForm = {
  nom: '', type: 'couvert', typeReglementaire: '', mineralisationEau: 'normale',
  longueur: '', largeur: '', profMin: '', profMax: '',
  surfSuperieure: '', surfInferieure: '', volumeTotal: '', debitReglementaire: '', debitInstallation: '',
  traitementPrincipal: '', typeStabilisant: '', typeMesure: '',
}

type BassinForm = typeof emptyForm

const TYPES = [
  { value: 'couvert', label: 'Bassin couvert' },
  { value: 'découvrable', label: 'Bassin découvrable' },
  { value: 'pleinair', label: 'Bassin plein air' },
]

const TRAITEMENTS = [
  { value: '',                label: '— Non renseigné —' },
  { value: 'Chlore',          label: 'Chlore' },
  { value: 'Brome',           label: 'Brome' },
  { value: 'PHMB',            label: 'PHMB (Polyhexaméthylène biguanide)' },
  { value: 'Sel/Électrolyse', label: 'Sel / Électrolyse' },
  { value: 'UV',              label: 'UV (ultraviolets)' },
  { value: 'Minéralisation',  label: 'Minéralisation' },
]

const STABILISANTS = [
  { value: '',           label: '— Non renseigné —' },
  { value: 'Magnésium',  label: 'Magnésium' },
  { value: 'Sel de mer', label: 'Sel de mer' },
  { value: 'Sel minéral',label: 'Sel minéral' },
  { value: 'Autre',      label: 'Autre' },
]

const TRAITEMENT_COLORS: Record<string, string> = {
  'Chlore': '#00aeef', 'Brome': '#f59e0b', 'PHMB': '#8b5cf6',
  'Sel/Électrolyse': '#10b981', 'UV': '#ec4899', 'Minéralisation': '#06b6d4',
}

// Badge de traitement coloré
function TraitementBadge({ traitement, stabilisant }: { traitement: string | null; stabilisant: string | null }) {
  if (!traitement) return <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>
  const color = TRAITEMENT_COLORS[traitement] ?? '#6b7280'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, borderRadius: 6, padding: '3px 9px', background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {traitement}
      {traitement === 'Minéralisation' && stabilisant && (
        <span style={{ fontWeight: 400, opacity: 0.85 }}>· {stabilisant}</span>
      )}
    </span>
  )
}

// Badge type de mesure
// ponctuelle = réglementaire (acte inscrit au carnet, requis par l'arrêté)
// analyseur  = non réglementaire (mesure en continu, complémentaire)
function MesureBadge({ typeMesure }: { typeMesure: string | null }) {
  if (!typeMesure) return null
  const isRegl = typeMesure === 'ponctuelle'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700,
      borderRadius: 6, padding: '3px 9px',
      background: isRegl ? '#10b98118' : '#f59e0b18',
      color: isRegl ? '#10b981' : '#d97706',
      border: `1px solid ${isRegl ? '#10b98144' : '#f59e0b44'}`,
    }}>
      {isRegl ? '📋 Réglementaire' : '⚙️ Analyse en continu'}
    </span>
  )
}

// Panneau de comparaison réglementaire / non réglementaire (dépliable)
function ComparisonPanel() {
  const rows = [
    { critere: 'Type d\'appareil',  regl: 'Colorimètre, kit DPD, bandelette réactive — mesure manuelle', nonRegl: 'Analyse en continu (raccordée au circuit)' },
    { critere: 'Fréquence',         regl: 'Mesure ponctuelle aux horaires définis (min. 1×/jour ouvert)', nonRegl: 'Mesure continue 24 h/24 — enregistrement automatique' },
    { critere: 'Valeur légale',      regl: 'Valeur de référence inscrite au carnet sanitaire — Arrêté 26/05/2021', nonRegl: 'Indicatif — complément d\'information non opposable' },
    { critere: 'Traçabilité',        regl: 'Manuelle : saisie obligatoire dans le carnet sanitaire', nonRegl: 'Automatique (journalisation interne de l\'appareil)' },
    { critere: 'Paramètres mesurés', regl: 'Chlore libre, chlore combiné, pH (mesures séparées)', nonRegl: 'Chlore libre, pH, potentiellement redox/température' },
    { critere: 'Obligation',         regl: 'Obligatoire pour tout ERP de natation (arrêté 26/05/2021)', nonRegl: 'Facultatif — équipement complémentaire non exigé' },
    { critere: 'Utilisation',        regl: 'Acte réglementaire : résultat inscrit et signé dans le carnet', nonRegl: 'Surveillance en temps réel, alertes automatiques' },
  ]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--text3)', borderBottom: '2px solid var(--border)', background: 'var(--surface2)', borderRadius: '8px 0 0 0' }}>
              Critère
            </th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#10b981', borderBottom: '2px solid #10b98133', background: '#10b98108', whiteSpace: 'nowrap' }}>
              📋 Mesure réglementaire (ponctuelle)
            </th>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#d97706', borderBottom: '2px solid #f59e0b33', background: '#f59e0b08', whiteSpace: 'nowrap', borderRadius: '0 8px 0 0' }}>
              ⚙️ Analyse en continu (non réglementaire)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text2)', fontSize: 12, background: 'var(--surface2)', whiteSpace: 'nowrap' }}>{r.critere}</td>
              <td style={{ padding: '10px 14px', color: 'var(--text)', lineHeight: 1.5, background: '#10b98105' }}>{r.regl}</td>
              <td style={{ padding: '10px 14px', color: 'var(--text)', lineHeight: 1.5, background: '#f59e0b05' }}>{r.nonRegl}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10, fontStyle: 'italic' }}>
        Référence : Arrêté du 26 mai 2021 relatif aux piscines à usage collectif — Art. 7 et Annexe II
      </p>
    </div>
  )
}

export default function BassinsClient({ initialData }: Props) {
  const [bassins, setBassins] = useState<Bassin[]>(initialData)
  const [editing, setEditing] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [newForm, setNewForm] = useState<BassinForm>(emptyForm)
  const [editForms, setEditForms] = useState<Record<number, BassinForm>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrBassin, setQrBassin] = useState<Bassin | null>(null)
  const [qrMode, setQrMode] = useState<'public' | 'saisie'>('public')
  const [origin, setOrigin] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setOrigin(window.location.origin)
    if (searchParams.get('new') === '1') setShowModal(true)
  }, [searchParams])

  const updNew = (k: string, v: string) => setNewForm(f => ({ ...f, [k]: v }))
  const updEdit = (id: number, k: string, v: string) => setEditForms(f => ({ ...f, [id]: { ...(f[id] ?? toForm(bassins.find(b => b.id === id)!)), [k]: v } }))

  const toForm = (b: Bassin): BassinForm => ({
    nom: b.nom, type: b.type,
    typeReglementaire: b.typeReglementaire ?? '',
    mineralisationEau: b.mineralisationEau ?? 'normale',
    longueur: String(b.longueur ?? ''), largeur: String(b.largeur ?? ''),
    profMin: String(b.profMin ?? ''), profMax: String(b.profMax ?? ''),
    surfSuperieure: String(b.surfSuperieure ?? ''), surfInferieure: String(b.surfInferieure ?? ''),
    volumeTotal: String(b.volumeTotal ?? ''), debitReglementaire: String(b.debitReglementaire ?? ''),
    debitInstallation: String(b.debitInstallation ?? ''),
    traitementPrincipal: b.traitementPrincipal ?? '',
    typeStabilisant: b.typeStabilisant ?? '',
    typeMesure: b.typeMesure ?? '',
  })

  const startEdit = (b: Bassin) => { setEditForms(f => ({ ...f, [b.id]: toForm(b) })); setEditing(b.id) }

  const handleCreate = async () => {
    if (!newForm.nom.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/bassins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? `Erreur ${res.status}`); return }
      setBassins(bs => [...bs, data as Bassin])
      setNewForm(emptyForm)
      setShowModal(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally { setSaving(false) }
  }

  const handleUpdate = async (id: number) => {
    const form = editForms[id]
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/bassins/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const b: Bassin = await res.json()
      setBassins(bs => bs.map(x => x.id === id ? b : x))
      setEditing(null)
      router.refresh()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/bassins/${id}`, { method: 'DELETE' })
    setBassins(bs => bs.filter(b => b.id !== id))
    setConfirmDelete(null)
    router.refresh()
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8,
    padding: '8px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none', width: '100%',
  }

  const FormGrid = ({ form, upd }: { form: BassinForm; upd: (k: string, v: string) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Dimensions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
        <Input label="Nom du bassin" value={form.nom} onChange={e => upd('nom', e.target.value)} required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Désignation</label>
          <select value={form.type} onChange={e => upd('type', e.target.value)} style={selectStyle}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Type réglementaire</label>
          <select value={form.typeReglementaire} onChange={e => upd('typeReglementaire', e.target.value)} style={selectStyle}>
            <option value="">— Non renseigné —</option>
            <option value="A">A — Piscines accès libre</option>
            <option value="B">B — Pataugeoires</option>
            <option value="C">C — Bassins couverts sportifs</option>
            <option value="D">D — Bassins plein air</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Minéralisation eau</label>
          <select value={form.mineralisationEau} onChange={e => upd('mineralisationEau', e.target.value)} style={selectStyle}>
            <option value="normale">Normale (&lt; 1 g/L)</option>
            <option value="forte">Forte (≥ 1 g/L)</option>
          </select>
        </div>
        <Input label="Longueur" value={form.longueur} onChange={e => upd('longueur', e.target.value)} type="number" unit="m" step={0.1} />
        <Input label="Largeur" value={form.largeur} onChange={e => upd('largeur', e.target.value)} type="number" unit="m" step={0.1} />
        <Input label="Prof. min" value={form.profMin} onChange={e => upd('profMin', e.target.value)} type="number" unit="m" step={0.1} />
        <Input label="Prof. max" value={form.profMax} onChange={e => upd('profMax', e.target.value)} type="number" unit="m" step={0.1} />
        <Input label="Surf. ≥1.5m" value={form.surfSuperieure} onChange={e => upd('surfSuperieure', e.target.value)} type="number" unit="m²" step={0.1} />
        <Input label="Surf. &lt;1.5m" value={form.surfInferieure} onChange={e => upd('surfInferieure', e.target.value)} type="number" unit="m²" step={0.1} />
        <Input label="Volume total" value={form.volumeTotal} onChange={e => upd('volumeTotal', e.target.value)} type="number" unit="m³" step={0.1} />
        <Input label="Débit régl." value={form.debitReglementaire} onChange={e => upd('debitReglementaire', e.target.value)} type="number" unit="m³/h" step={0.1} />
        <Input label="Débit install." value={form.debitInstallation} onChange={e => upd('debitInstallation', e.target.value)} type="number" unit="m³/h" step={0.1} />
      </div>

      {/* Traitement stabilisant + type de mesure */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Traitement &amp; mesure
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>

          {/* Traitement principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Traitement principal</label>
            <select value={form.traitementPrincipal} onChange={e => { upd('traitementPrincipal', e.target.value); if (e.target.value !== 'Minéralisation') upd('typeStabilisant', '') }} style={selectStyle}>
              {TRAITEMENTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Type de sel minéral (conditionnel) */}
          {form.traitementPrincipal === 'Minéralisation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Type de sel minéral</label>
              <select value={form.typeStabilisant} onChange={e => upd('typeStabilisant', e.target.value)} style={selectStyle}>
                {STABILISANTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}

          {/* Type de mesure */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>
              Type de mesure
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: 'var(--text3)' }}>(voir comparaison ↑)</span>
            </label>
            <select value={form.typeMesure} onChange={e => upd('typeMesure', e.target.value)} style={{
              ...selectStyle,
              borderColor: form.typeMesure === 'ponctuelle' ? '#10b98166' : form.typeMesure === 'analyseur' ? '#f59e0b66' : undefined,
              color: form.typeMesure === 'ponctuelle' ? '#10b981' : form.typeMesure === 'analyseur' ? '#d97706' : undefined,
            }}>
              <option value="">— Non renseigné —</option>
              <option value="ponctuelle">📋 Mesure ponctuelle (réglementaire)</option>
              <option value="analyseur">⚙️ Analyse en continu (non réglementaire)</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Dossier technique des bassins</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Résumé technique — Arrêté 26/05/2021</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HelpPanel pageId="bassins" />
          <button onClick={() => window.open('/preview/bassins', '_blank')} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600 }}>
            <Icon name="download" size={16} />PDF
          </button>
          <CanManageConfig>
            <Btn icon="plus" onClick={() => { setNewForm(emptyForm); setShowModal(true) }}>Ajouter un bassin</Btn>
          </CanManageConfig>
        </div>
      </div>

      {/* Panneau comparaison mesures réglementaire / non réglementaire */}
      <div style={{ border: '1px solid var(--border2)', borderRadius: 12, overflow: 'hidden' }}>
        <button
          onClick={() => setShowComparison(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', background: 'var(--surface2)', border: 'none', cursor: 'pointer',
            fontFamily: 'DM Sans', gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                Mesure réglementaire vs Non réglementaire
              </p>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                Différences entre l'analyseur de chlore continu et la mesure ponctuelle — Arrêté 26/05/2021
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#10b98118', color: '#10b981', border: '1px solid #10b98133' }}>📋 Réglementaire</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#f59e0b18', color: '#d97706', border: '1px solid #f59e0b33' }}>⚙️ Analyse en continu</span>
            <span style={{ display: 'flex', transform: showComparison ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <Icon name="chevronDown" size={16} color="var(--text3)" />
            </span>
          </div>
        </button>
        {showComparison && (
          <div style={{ padding: '0 4px 4px' }}>
            <ComparisonPanel />
          </div>
        )}
      </div>

      {bassins.length === 0 && (
        <Card><div className="empty-state"><Icon name="pool" size={32} color="var(--text3)" /><p>Aucun bassin configuré</p><CanManageConfig><Btn icon="plus" onClick={() => setShowModal(true)}>Ajouter un bassin</Btn></CanManageConfig></div></Card>
      )}

      {bassins.map(b => (
        <Card key={b.id} style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6, zIndex: 1 }}>
            <button onClick={() => setQrBassin(b)} title="QR code de ce bassin" style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--accent)', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
              <Icon name="qrcode" size={15} />
            </button>
            <CanManageConfig>
              <button onClick={() => editing === b.id ? setEditing(null) : startEdit(b)} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--accent)', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
                <Icon name="edit" size={15} />
              </button>
            </CanManageConfig>
            <CanDelete>
              <button onClick={() => setConfirmDelete(b.id)} style={{ background: 'var(--surface2)', border: '1px solid var(--red)44', color: 'var(--red)', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
                <Icon name="trash" size={15} />
              </button>
            </CanDelete>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingRight: 90 }}>
            <div style={{ background: 'var(--accent)22', borderRadius: 8, padding: 8 }}>
              <Icon name="pool" size={18} color="var(--accent)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15 }}>{b.nom}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Bassin {b.type}</span>
                {b.typeReglementaire && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--accent)18', color: 'var(--accent)', border: '1px solid var(--accent)33' }}>
                    Type {b.typeReglementaire}
                  </span>
                )}
                {b.mineralisationEau === 'forte' && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#f59e0b18', color: '#d97706', border: '1px solid #f59e0b33' }}>
                    Minéralisation forte
                  </span>
                )}
              </div>
            </div>
          </div>

          {editing === b.id ? (
            <CanManageConfig>
              <FormGrid form={editForms[b.id] ?? toForm(b)} upd={(k, v) => updEdit(b.id, k, v)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <Btn small icon="save" onClick={() => handleUpdate(b.id)} disabled={saving}>Enregistrer</Btn>
                <Btn small variant="ghost" onClick={() => setEditing(null)}>Annuler</Btn>
              </div>
            </CanManageConfig>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
                <Metric label="Longueur" value={b.longueur} unit={b.longueur ? 'm' : undefined} />
                <Metric label="Largeur" value={b.largeur} unit={b.largeur ? 'm' : undefined} />
                <Metric label="Prof. min" value={b.profMin} unit={b.profMin ? 'm' : undefined} />
                <Metric label="Prof. max" value={b.profMax} unit={b.profMax ? 'm' : undefined} />
                <Metric label="Volume" value={b.volumeTotal} unit={b.volumeTotal ? 'm³' : undefined} />
                <Metric label="Débit régl." value={b.debitReglementaire} unit={b.debitReglementaire ? 'm³/h' : undefined} />
                <Metric label="Débit install." value={b.debitInstallation} unit={b.debitInstallation ? 'm³/h' : undefined} />
              </div>
              {(b.traitementPrincipal || b.typeMesure) && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {b.traitementPrincipal && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0, minWidth: 75 }}>Traitement :</span>
                      <TraitementBadge traitement={b.traitementPrincipal} stabilisant={b.typeStabilisant} />
                    </div>
                  )}
                  {b.typeMesure && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0, minWidth: 75 }}>Mesure :</span>
                      <MesureBadge typeMesure={b.typeMesure} />
                      {b.typeMesure === 'ponctuelle' && (
                        <span style={{ fontSize: 11, color: '#10b981', fontStyle: 'italic' }}>— Conforme art. 7 Arrêté 26/05/2021</span>
                      )}
                      {b.typeMesure === 'analyseur' && (
                        <span style={{ fontSize: 11, color: '#d97706', fontStyle: 'italic' }}>— Mesure complémentaire (non opposable)</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      {/* Modal ajout */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(14,79,110,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border2)', maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface)' }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>Ajouter un bassin</h3>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Renseignez les caractéristiques techniques du bassin</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4 }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <FormGrid form={newForm} upd={updNew} />
              {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12, padding: '8px 12px', background: 'var(--red)11', borderRadius: 8 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
                <Btn variant="ghost" onClick={() => setShowModal(false)}>Annuler</Btn>
                <Btn icon="save" onClick={handleCreate} disabled={saving || !newForm.nom.trim()}>Enregistrer le bassin</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR code bassin individuel */}
      {qrBassin && (
        <div onClick={() => setQrBassin(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(14,79,110,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>QR Code — {qrBassin.nom}</h3>
              <button onClick={() => setQrBassin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 20 }}>×</button>
            </div>

            {/* Toggle public / saisie */}
            <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 3, border: '1px solid var(--border)', marginBottom: 16 }}>
              {(['public', 'saisie'] as const).map(m => (
                <button key={m} onClick={() => setQrMode(m)} style={{
                  flex: 1, padding: '7px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: qrMode === m ? 'var(--accent)' : 'transparent',
                  color: qrMode === m ? '#fff' : 'var(--text2)',
                  fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600,
                }}>
                  {m === 'public' ? '📱 Nageurs (public)' : '🔬 Saisie (technicien)'}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
              {qrMode === 'public'
                ? '👥 À afficher au bord du bassin — les nageurs scannent pour voir la qualité de l\'eau en temps réel (sans login)'
                : '🔬 À scanner avec l\'app — ouvre directement le formulaire de saisie sur ce bassin'}
            </div>

            <QRModal
              title={`QR — ${qrBassin.nom}`}
              subtitle={qrMode === 'public' ? 'Page publique qualité eau' : 'Saisie relevé technicien'}
              url={qrMode === 'public'
                ? `${origin}/public/bassin/${qrBassin.id}`
                : `${origin}/releves?bassinId=${qrBassin.id}`}
              onClose={() => setQrBassin(null)}
              embedded
            />
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete !== null && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(14,79,110,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--red)44', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--red)', marginBottom: 8 }}>Supprimer ce bassin ?</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>
              Cette action est définitive. Le bassin « {bassins.find(b => b.id === confirmDelete)?.nom} » et tous ses relevés associés seront supprimés.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>Annuler</Btn>
              <Btn variant="danger" onClick={() => handleDelete(confirmDelete!)}>Supprimer</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
