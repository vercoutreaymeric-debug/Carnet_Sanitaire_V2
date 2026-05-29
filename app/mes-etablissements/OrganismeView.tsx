'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import Btn from '@/components/Btn'

interface Abonnement { plan: string; statut: string; dateExpiration: string }
interface Organisme  { id: number; nom: string; type: string; adresse: string; telephone: string }
interface Etab {
  id: number; nom: string; adresse: string; telephone: string; createdAt: string
  abonnement: Abonnement | null
  _count: { users: number; bassins: number; releves: number }
}

const STATUT_COLOR: Record<string, string> = {
  actif: '#10b981', essai: '#f59e0b', suspendu: '#f97316', expiré: '#ef4444',
}

const TYPE_OPTIONS = ['société', 'association', 'collectivité', 'EPCI', 'autre']

export default function OrganismeView({
  organisme: initOrg, etablissements: initEtabs, organismeId,
}: {
  organisme: Organisme | null
  etablissements: Etab[]
  organismeId: number | null
}) {
  const router = useRouter()
  const [org, setOrg] = useState(initOrg)
  const [etabs, setEtabs] = useState(initEtabs)
  const [tab, setTab] = useState<'etabs' | 'info'>('etabs')

  // Formulaire création étab
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    nom: '', adresse: '', telephone: '',
    adminUsername: '', adminPassword: '', adminNom: '', adminEmail: '',
  })

  // Édition étab
  const [editEtabId, setEditEtabId] = useState<number | null>(null)
  const [editEtabForm, setEditEtabForm] = useState({ nom: '', adresse: '', telephone: '' })

  // Édition organisme
  const [editOrg, setEditOrg] = useState(false)
  const [editOrgForm, setEditOrgForm] = useState({ nom: org?.nom ?? '', type: org?.type ?? 'société', adresse: org?.adresse ?? '', telephone: org?.telephone ?? '' })

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const inp = (s?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', ...s,
  })

  async function refreshEtabs() {
    const r = await fetch('/api/organisme/etablissements')
    if (r.ok) setEtabs(await r.json())
  }

  async function creerEtab() {
    if (!createForm.nom || !createForm.adminUsername || !createForm.adminPassword) return
    setCreating(true); setMsg(null)
    const r = await fetch('/api/organisme/etablissements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createForm, organismeId }),
    })
    setCreating(false)
    const d = await r.json()
    if (r.ok) {
      setMsg({ text: `✅ "${createForm.nom}" créé !`, ok: true })
      setShowCreate(false)
      setCreateForm({ nom: '', adresse: '', telephone: '', adminUsername: '', adminPassword: '', adminNom: '', adminEmail: '' })
      await refreshEtabs()
    } else setMsg({ text: '❌ ' + (d.error || 'Erreur'), ok: false })
  }

  async function sauvegarderEtab(id: number) {
    setLoading(true); setMsg(null)
    const r = await fetch(`/api/organisme/etablissements/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editEtabForm),
    })
    setLoading(false)
    if (r.ok) { setMsg({ text: '✅ Modifié', ok: true }); setEditEtabId(null); await refreshEtabs() }
    else { const d = await r.json(); setMsg({ text: '❌ ' + d.error, ok: false }) }
  }

  async function supprimerEtab(id: number) {
    setLoading(true)
    const r = await fetch(`/api/organisme/etablissements/${id}`, { method: 'DELETE' })
    setLoading(false); setConfirmDelete(null)
    if (r.ok) { setMsg({ text: '✅ Établissement supprimé', ok: true }); await refreshEtabs(); router.refresh() }
    else { let e = `Erreur ${r.status}`; try { e = (await r.json()).error } catch {} ; setMsg({ text: '❌ ' + e, ok: false }) }
  }

  async function sauvegarderOrg() {
    if (!org) return
    setLoading(true); setMsg(null)
    const r = await fetch(`/api/groupe/organismes/${org.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editOrgForm),
    })
    setLoading(false)
    if (r.ok) { const d = await r.json(); setOrg(d); setEditOrg(false); setMsg({ text: '✅ Organisme mis à jour', ok: true }) }
    else { const d = await r.json(); setMsg({ text: '❌ ' + d.error, ok: false }) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ background: '#00aeef22', borderRadius: 10, padding: '6px 8px', display: 'inline-flex' }}>
            <Icon name="building" size={20} color="#00aeef" />
          </span>
          {org?.nom ?? 'Mon organisme'}
        </h1>
        {org && (
          <p style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 46 }}>
            {org.type} · {etabs.length} établissement{etabs.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {(['etabs', 'info'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: tab === t ? 700 : 400,
            color: tab === t ? '#00aeef' : 'var(--text2)',
            borderBottom: tab === t ? '2px solid #00aeef' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
          }}>
            {t === 'etabs' ? `🏊 Établissements (${etabs.length})` : '⚙️ Mon organisme'}
          </button>
        ))}
      </div>

      {/* Message */}
      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: msg.ok ? '#10b98118' : '#ef444418', border: `1px solid ${msg.ok ? '#10b98144' : '#ef444444'}`,
          color: msg.ok ? '#10b981' : '#ef4444' }}>
          {msg.text}
        </div>
      )}

      {/* ── Onglet Établissements ── */}
      {tab === 'etabs' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Btn icon="add" onClick={() => { setShowCreate(v => !v); setMsg(null) }}>
              {showCreate ? 'Annuler' : 'Nouvel établissement'}
            </Btn>
          </div>

          {showCreate && (
            <Card style={{ marginBottom: 20, border: '2px solid #00aeef44' }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#00aeef', marginBottom: 14 }}>➕ Nouvel établissement</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 14 }}>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom *</label><input style={inp()} value={createForm.nom} onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))} placeholder="Piscine Massy" /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Adresse</label><input style={inp()} value={createForm.adresse} onChange={e => setCreateForm(f => ({ ...f, adresse: e.target.value }))} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Téléphone</label><input style={inp()} value={createForm.telephone} onChange={e => setCreateForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Compte responsable établissement</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 16 }}>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Identifiant *</label><input style={inp()} value={createForm.adminUsername} onChange={e => setCreateForm(f => ({ ...f, adminUsername: e.target.value }))} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Mot de passe *</label><input style={inp()} type="password" value={createForm.adminPassword} onChange={e => setCreateForm(f => ({ ...f, adminPassword: e.target.value }))} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom affiché</label><input style={inp()} value={createForm.adminNom} onChange={e => setCreateForm(f => ({ ...f, adminNom: e.target.value }))} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Email</label><input style={inp()} type="email" value={createForm.adminEmail} onChange={e => setCreateForm(f => ({ ...f, adminEmail: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn icon="save" onClick={creerEtab} disabled={creating || !createForm.nom || !createForm.adminUsername || !createForm.adminPassword}>
                  {creating ? 'Création...' : 'Créer'}
                </Btn>
                <Btn variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Btn>
              </div>
            </Card>
          )}

          {etabs.length === 0 ? (
            <Card><div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏊</div>
              <p>Aucun établissement. Créez le premier !</p>
            </div></Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {etabs.map(etab => (
                <div key={etab.id} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <p style={{ fontWeight: 700 }}>{etab.nom}</p>
                      <p style={{ fontSize: 12, color: 'var(--text3)' }}>{etab.adresse || 'Adresse non renseignée'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {etab.abonnement && (
                        <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 700,
                          background: `${STATUT_COLOR[etab.abonnement.statut]}22`,
                          color: STATUT_COLOR[etab.abonnement.statut],
                          border: `1px solid ${STATUT_COLOR[etab.abonnement.statut]}44` }}>
                          {etab.abonnement.plan} · {etab.abonnement.statut}
                        </span>
                      )}
                      <button onClick={() => { setEditEtabId(etab.id); setEditEtabForm({ nom: etab.nom, adresse: etab.adresse, telephone: etab.telephone }) }} style={{ background: 'var(--accent)22', color: 'var(--accent)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✏️</button>
                      <button onClick={() => setConfirmDelete(etab.id)} style={{ background: '#ef444422', color: '#ef4444', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ padding: '8px 16px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>👤 <b>{etab._count.users}</b> user(s)</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>🏊 <b>{etab._count.bassins}</b> bassin(s)</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>📊 <b>{etab._count.releves}</b> relevé(s)</span>
                  </div>
                  {editEtabId === etab.id && (
                    <div style={{ padding: 14, borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 12 }}>
                        <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom</label><input style={inp()} value={editEtabForm.nom} onChange={e => setEditEtabForm(f => ({ ...f, nom: e.target.value }))} /></div>
                        <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Adresse</label><input style={inp()} value={editEtabForm.adresse} onChange={e => setEditEtabForm(f => ({ ...f, adresse: e.target.value }))} /></div>
                        <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Téléphone</label><input style={inp()} value={editEtabForm.telephone} onChange={e => setEditEtabForm(f => ({ ...f, telephone: e.target.value }))} /></div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn icon="save" onClick={() => sauvegarderEtab(etab.id)} disabled={loading}>Sauvegarder</Btn>
                        <Btn variant="ghost" onClick={() => setEditEtabId(null)}>Annuler</Btn>
                      </div>
                    </div>
                  )}
                  {confirmDelete === etab.id && (
                    <div style={{ padding: '12px 16px', background: '#ef444411', borderTop: '1px solid #ef444433', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>⚠️ Supprimer <b>{etab.nom}</b> et toutes ses données ?</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => supprimerEtab(etab.id)} disabled={loading} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Supprimer</button>
                        <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>Annuler</Btn>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Onglet Info organisme ── */}
      {tab === 'info' && org && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Informations de l'organisme</p>
            <button onClick={() => { setEditOrg(v => !v); setEditOrgForm({ nom: org.nom, type: org.type, adresse: org.adresse, telephone: org.telephone }) }} style={{ background: 'var(--accent)22', color: 'var(--accent)', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {editOrg ? 'Annuler' : '✏️ Modifier'}
            </button>
          </div>
          {editOrg ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 16 }}>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom</label><input style={inp()} value={editOrgForm.nom} onChange={e => setEditOrgForm(f => ({ ...f, nom: e.target.value }))} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Type</label>
                  <select style={inp()} value={editOrgForm.type} onChange={e => setEditOrgForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Adresse</label><input style={inp()} value={editOrgForm.adresse} onChange={e => setEditOrgForm(f => ({ ...f, adresse: e.target.value }))} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Téléphone</label><input style={inp()} value={editOrgForm.telephone} onChange={e => setEditOrgForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              </div>
              <Btn icon="save" onClick={sauvegarderOrg} disabled={loading}>Enregistrer</Btn>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              {[['Nom', org.nom], ['Type', org.type], ['Adresse', org.adresse || '—'], ['Téléphone', org.telephone || '—']].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{k}</p>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{v}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
