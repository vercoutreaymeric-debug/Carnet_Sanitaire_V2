'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import Btn from '@/components/Btn'

interface Abonnement { plan: string; statut: string; dateExpiration: string }
interface Etab {
  id: number; nom: string; adresse: string; telephone: string
  abonnement: Abonnement | null
  _count: { users: number; bassins: number; releves: number }
}
interface OrgUser { id: number; username: string; nom: string; email: string }
interface Organisme {
  id: number; nom: string; type: string; adresse: string; telephone: string
  etablissements: Etab[]
  users: OrgUser[]
  _count: { etablissements: number }
}
interface Groupe { id: number; nom: string }

const STATUT_COLOR: Record<string, string> = {
  actif: '#10b981', essai: '#f59e0b', suspendu: '#f97316', expiré: '#ef4444',
}
const TYPE_OPTIONS = ['société', 'association', 'collectivité', 'EPCI', 'autre']

// ── Ligne établissement compacte ─────────────────────────────────────────────
function EtabRow({ etab, onEdit, onDelete }: {
  etab: Etab
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      <div style={{ padding: '10px 14px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#00aeef18', borderRadius: 6, padding: '4px 6px', display: 'flex' }}>
            <Icon name="building" size={14} color="#00aeef" />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{etab.nom}</p>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>{etab.adresse || 'Adresse non renseignée'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {etab.abonnement && (
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700,
              background: `${STATUT_COLOR[etab.abonnement.statut]}22`,
              color: STATUT_COLOR[etab.abonnement.statut],
              border: `1px solid ${STATUT_COLOR[etab.abonnement.statut]}44` }}>
              {etab.abonnement.plan} · {etab.abonnement.statut}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            👤{etab._count.users} · 🏊{etab._count.bassins} · 📊{etab._count.releves}
          </span>
          <button onClick={onEdit} style={{ background: 'var(--accent)22', color: 'var(--accent)', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✏️</button>
          <button onClick={onDelete} style={{ background: '#ef444422', color: '#ef4444', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>🗑️</button>
        </div>
      </div>
    </div>
  )
}

// ── Carte organisme ──────────────────────────────────────────────────────────
function OrgCard({
  org, onUpdated, onDeleted,
}: {
  org: Organisme
  onUpdated: (o: Organisme) => void
  onDeleted: (id: number) => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [editOrg, setEditOrg] = useState(false)
  const [editOrgForm, setEditOrgForm] = useState({ nom: org.nom, type: org.type, adresse: org.adresse, telephone: org.telephone })
  const [confirmDelOrg, setConfirmDelOrg] = useState(false)

  // Création étab
  const [showCreateEtab, setShowCreateEtab] = useState(false)
  const [createEtabForm, setCreateEtabForm] = useState({
    nom: '', adresse: '', telephone: '',
    adminUsername: '', adminPassword: '', adminNom: '', adminEmail: '',
  })

  // Édition étab
  const [editEtabId, setEditEtabId] = useState<number | null>(null)
  const [editEtabForm, setEditEtabForm] = useState({ nom: '', adresse: '', telephone: '' })
  const [confirmDelEtab, setConfirmDelEtab] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [etabs, setEtabs] = useState(org.etablissements)

  const inp = (s?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '7px 11px', borderRadius: 7, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', ...s,
  })

  async function sauvegarderOrg() {
    setLoading(true); setMsg(null)
    const r = await fetch(`/api/groupe/organismes/${org.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editOrgForm),
    })
    setLoading(false)
    if (r.ok) {
      const d = await r.json()
      onUpdated({ ...org, ...d, etablissements: etabs })
      setEditOrg(false)
      setMsg({ text: '✅ Organisme modifié', ok: true })
    } else { const d = await r.json(); setMsg({ text: '❌ ' + d.error, ok: false }) }
  }

  async function supprimerOrg() {
    setLoading(true)
    const r = await fetch(`/api/groupe/organismes/${org.id}`, { method: 'DELETE' })
    setLoading(false); setConfirmDelOrg(false)
    if (r.ok) { onDeleted(org.id); router.refresh() }
    else { let e = `Erreur ${r.status}`; try { e = (await r.json()).error } catch {}; setMsg({ text: '❌ ' + e, ok: false }) }
  }

  async function creerEtab() {
    if (!createEtabForm.nom || !createEtabForm.adminUsername || !createEtabForm.adminPassword) return
    setLoading(true); setMsg(null)
    const r = await fetch('/api/organisme/etablissements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createEtabForm, organismeId: org.id }),
    })
    setLoading(false)
    const d = await r.json()
    if (r.ok) {
      setMsg({ text: `✅ "${createEtabForm.nom}" créé !`, ok: true })
      setShowCreateEtab(false)
      setCreateEtabForm({ nom: '', adresse: '', telephone: '', adminUsername: '', adminPassword: '', adminNom: '', adminEmail: '' })
      // Rafraîchir la liste des étabs
      const etab: Etab = { id: d.etab.id, nom: d.etab.nom, adresse: d.etab.adresse, telephone: d.etab.telephone, abonnement: null, _count: { users: 1, bassins: 0, releves: 0 } }
      setEtabs(prev => [etab, ...prev])
    } else setMsg({ text: '❌ ' + (d.error || 'Erreur'), ok: false })
  }

  async function sauvegarderEtab(id: number) {
    setLoading(true); setMsg(null)
    const r = await fetch(`/api/organisme/etablissements/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editEtabForm),
    })
    setLoading(false)
    if (r.ok) {
      setEtabs(prev => prev.map(e => e.id === id ? { ...e, ...editEtabForm } : e))
      setEditEtabId(null)
      setMsg({ text: '✅ Modifié', ok: true })
    } else { const d = await r.json(); setMsg({ text: '❌ ' + d.error, ok: false }) }
  }

  async function supprimerEtab(id: number) {
    setLoading(true)
    const r = await fetch(`/api/organisme/etablissements/${id}`, { method: 'DELETE' })
    setLoading(false); setConfirmDelEtab(null)
    if (r.ok) { setEtabs(prev => prev.filter(e => e.id !== id)); setMsg({ text: '✅ Établissement supprimé', ok: true }) }
    else { let e = `Erreur ${r.status}`; try { e = (await r.json()).error } catch {}; setMsg({ text: '❌ ' + e, ok: false }) }
  }

  return (
    <div style={{ border: '2px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
      {/* Header organisme */}
      <div style={{ padding: '14px 18px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
          <div style={{ background: '#0097A722', borderRadius: 8, padding: '7px 8px', display: 'flex' }}>
            <Icon name="building" size={18} color="#0097A7" />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{org.nom}</p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>
              {org.type} · {etabs.length} établissement{etabs.length !== 1 ? 's' : ''}
              {org.users.length > 0 && ` · ${org.users[0].nom}`}
            </p>
          </div>
          <span style={{ fontSize: 18, color: 'var(--text3)', marginLeft: 4 }}>{open ? '▾' : '▸'}</span>
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditOrg(v => !v)} style={{ background: 'var(--accent)22', color: 'var(--accent)', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✏️ Modifier</button>
          <button onClick={() => setConfirmDelOrg(true)} style={{ background: '#ef444422', color: '#ef4444', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ margin: '0 16px', marginTop: 10, padding: '8px 12px', borderRadius: 7, fontSize: 12,
          background: msg.ok ? '#10b98118' : '#ef444418', color: msg.ok ? '#10b981' : '#ef4444' }}>
          {msg.text}
        </div>
      )}

      {/* Formulaire édition organisme */}
      {editOrg && (
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom</label><input style={inp()} value={editOrgForm.nom} onChange={e => setEditOrgForm(f => ({ ...f, nom: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Type</label>
              <select style={inp()} value={editOrgForm.type} onChange={e => setEditOrgForm(f => ({ ...f, type: e.target.value }))}>
                {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Adresse</label><input style={inp()} value={editOrgForm.adresse} onChange={e => setEditOrgForm(f => ({ ...f, adresse: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Téléphone</label><input style={inp()} value={editOrgForm.telephone} onChange={e => setEditOrgForm(f => ({ ...f, telephone: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn icon="save" onClick={sauvegarderOrg} disabled={loading}>Sauvegarder</Btn>
            <Btn variant="ghost" onClick={() => setEditOrg(false)}>Annuler</Btn>
          </div>
        </div>
      )}

      {/* Confirmation suppression organisme */}
      {confirmDelOrg && (
        <div style={{ padding: '12px 18px', background: '#ef444411', borderTop: '1px solid #ef444433', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>⚠️ Supprimer <b>{org.nom}</b> ? Ses établissements seront détachés (non supprimés).</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={supprimerOrg} disabled={loading} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Supprimer</button>
            <Btn variant="ghost" onClick={() => setConfirmDelOrg(false)}>Annuler</Btn>
          </div>
        </div>
      )}

      {/* Liste des établissements */}
      {open && (
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
              Établissements ({etabs.length})
            </p>
            <button onClick={() => setShowCreateEtab(v => !v)} style={{
              background: '#00aeef', color: '#fff', border: 'none', borderRadius: 7,
              padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="add" size={12} /> {showCreateEtab ? 'Annuler' : 'Ajouter un établissement'}
            </button>
          </div>

          {/* Formulaire création étab */}
          {showCreateEtab && (
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#00aeef', marginBottom: 10 }}>➕ Nouvel établissement dans {org.nom}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Nom *</label><input style={inp()} value={createEtabForm.nom} onChange={e => setCreateEtabForm(f => ({ ...f, nom: e.target.value }))} placeholder="Piscine Massy" /></div>
                <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Adresse</label><input style={inp()} value={createEtabForm.adresse} onChange={e => setCreateEtabForm(f => ({ ...f, adresse: e.target.value }))} /></div>
                <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Téléphone</label><input style={inp()} value={createEtabForm.telephone} onChange={e => setCreateEtabForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Compte responsable établissement</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginBottom: 12 }}>
                <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Identifiant *</label><input style={inp()} value={createEtabForm.adminUsername} onChange={e => setCreateEtabForm(f => ({ ...f, adminUsername: e.target.value }))} /></div>
                <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Mot de passe *</label><input style={inp()} type="password" value={createEtabForm.adminPassword} onChange={e => setCreateEtabForm(f => ({ ...f, adminPassword: e.target.value }))} /></div>
                <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Nom</label><input style={inp()} value={createEtabForm.adminNom} onChange={e => setCreateEtabForm(f => ({ ...f, adminNom: e.target.value }))} /></div>
                <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Email</label><input style={inp()} type="email" value={createEtabForm.adminEmail} onChange={e => setCreateEtabForm(f => ({ ...f, adminEmail: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={creerEtab} disabled={loading || !createEtabForm.nom || !createEtabForm.adminUsername || !createEtabForm.adminPassword} style={{
                  background: '#00aeef', color: '#fff', border: 'none', borderRadius: 7,
                  padding: '7px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  opacity: (loading || !createEtabForm.nom) ? 0.6 : 1,
                }}>
                  {loading ? 'Création...' : '✅ Créer'}
                </button>
                <Btn variant="ghost" onClick={() => setShowCreateEtab(false)}>Annuler</Btn>
              </div>
            </div>
          )}

          {etabs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic', padding: '8px 0' }}>
              Aucun établissement — cliquez sur "Ajouter un établissement" pour commencer.
            </p>
          ) : (
            etabs.map(etab => (
              <div key={etab.id}>
                <EtabRow
                  etab={etab}
                  onEdit={() => { setEditEtabId(etab.id); setEditEtabForm({ nom: etab.nom, adresse: etab.adresse, telephone: etab.telephone }) }}
                  onDelete={() => setConfirmDelEtab(etab.id)}
                />
                {editEtabId === etab.id && (
                  <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8, marginBottom: 10 }}>
                      <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Nom</label><input style={inp()} value={editEtabForm.nom} onChange={e => setEditEtabForm(f => ({ ...f, nom: e.target.value }))} /></div>
                      <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Adresse</label><input style={inp()} value={editEtabForm.adresse} onChange={e => setEditEtabForm(f => ({ ...f, adresse: e.target.value }))} /></div>
                      <div><label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Téléphone</label><input style={inp()} value={editEtabForm.telephone} onChange={e => setEditEtabForm(f => ({ ...f, telephone: e.target.value }))} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn icon="save" onClick={() => sauvegarderEtab(etab.id)} disabled={loading}>Sauvegarder</Btn>
                      <Btn variant="ghost" onClick={() => setEditEtabId(null)}>Annuler</Btn>
                    </div>
                  </div>
                )}
                {confirmDelEtab === etab.id && (
                  <div style={{ padding: '10px 14px', background: '#ef444411', borderRadius: 8, marginBottom: 8, border: '1px solid #ef444433', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>⚠️ Supprimer <b>{etab.nom}</b> et toutes ses données ?</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => supprimerEtab(etab.id)} disabled={loading} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Supprimer</button>
                      <Btn variant="ghost" onClick={() => setConfirmDelEtab(null)}>Annuler</Btn>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Page principale vue Groupe ───────────────────────────────────────────────
export default function GroupeView({
  groupe, organismes: initOrgs, groupeId,
}: {
  groupe: Groupe | null
  organismes: Organisme[]
  groupeId: number | null
}) {
  const [organismes, setOrganismes] = useState(initOrgs)
  const [tab, setTab] = useState<'organismes' | 'tous'>('organismes')
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [createOrgForm, setCreateOrgForm] = useState({
    nom: '', type: 'société', adresse: '', telephone: '',
    username: '', password: '', nomContact: '', email: '',
  })
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const inp = (s?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', ...s,
  })

  const allEtabs = organismes.flatMap(o => o.etablissements.map(e => ({ ...e, _orgNom: o.nom })))

  async function creerOrganisme() {
    if (!createOrgForm.nom) return
    setCreating(true); setMsg(null)
    const r = await fetch('/api/groupe/organismes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createOrgForm, groupeId }),
    })
    setCreating(false)
    const d = await r.json()
    if (r.ok) {
      setMsg({ text: `✅ Organisme "${createOrgForm.nom}" créé !`, ok: true })
      setShowCreateOrg(false)
      setCreateOrgForm({ nom: '', type: 'société', adresse: '', telephone: '', username: '', password: '', nomContact: '', email: '' })
      setOrganismes(prev => [d, ...prev])
    } else setMsg({ text: '❌ ' + (d.error || 'Erreur'), ok: false })
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ background: '#0097A722', borderRadius: 10, padding: '6px 8px', display: 'inline-flex' }}>
            <Icon name="building" size={20} color="#0097A7" />
          </span>
          {groupe ? `Groupe : ${groupe.nom}` : 'Mon périmètre'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 46 }}>
          {organismes.length} organisme{organismes.length !== 1 ? 's' : ''} · {allEtabs.length} établissement{allEtabs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'organismes', label: `🏛️ Organismes (${organismes.length})` },
          { key: 'tous',       label: `🏊 Tous les étabs (${allEtabs.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)} style={{
            padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: tab === key ? 700 : 400,
            color: tab === key ? '#0097A7' : 'var(--text2)',
            borderBottom: tab === key ? '2px solid #0097A7' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Message global */}
      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: msg.ok ? '#10b98118' : '#ef444418', border: `1px solid ${msg.ok ? '#10b98144' : '#ef444444'}`,
          color: msg.ok ? '#10b981' : '#ef4444' }}>
          {msg.text}
        </div>
      )}

      {/* ── Onglet Organismes ── */}
      {tab === 'organismes' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Btn icon="add" onClick={() => { setShowCreateOrg(v => !v); setMsg(null) }}>
              {showCreateOrg ? 'Annuler' : 'Nouvel organisme'}
            </Btn>
          </div>

          {/* Formulaire création organisme */}
          {showCreateOrg && (
            <Card style={{ marginBottom: 24, border: '2px solid #0097A744' }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#0097A7', marginBottom: 14 }}>➕ Nouvel organisme</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 14 }}>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom *</label><input style={inp()} value={createOrgForm.nom} onChange={e => setCreateOrgForm(f => ({ ...f, nom: e.target.value }))} placeholder="Récréa Île-de-France" /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Type</label>
                  <select style={inp()} value={createOrgForm.type} onChange={e => setCreateOrgForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Adresse</label><input style={inp()} value={createOrgForm.adresse} onChange={e => setCreateOrgForm(f => ({ ...f, adresse: e.target.value }))} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Téléphone</label><input style={inp()} value={createOrgForm.telephone} onChange={e => setCreateOrgForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Compte responsable organisme (optionnel)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 18 }}>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Identifiant</label><input style={inp()} value={createOrgForm.username} onChange={e => setCreateOrgForm(f => ({ ...f, username: e.target.value }))} placeholder="marie.legrand" /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Mot de passe</label><input style={inp()} type="password" value={createOrgForm.password} onChange={e => setCreateOrgForm(f => ({ ...f, password: e.target.value }))} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom affiché</label><input style={inp()} value={createOrgForm.nomContact} onChange={e => setCreateOrgForm(f => ({ ...f, nomContact: e.target.value }))} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Email</label><input style={inp()} type="email" value={createOrgForm.email} onChange={e => setCreateOrgForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn icon="save" onClick={creerOrganisme} disabled={creating || !createOrgForm.nom}>
                  {creating ? 'Création...' : 'Créer l\'organisme'}
                </Btn>
                <Btn variant="ghost" onClick={() => setShowCreateOrg(false)}>Annuler</Btn>
              </div>
            </Card>
          )}

          {organismes.length === 0 ? (
            <Card><div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏛️</div>
              <p>Aucun organisme. Créez le premier !</p>
            </div></Card>
          ) : (
            organismes.map(org => (
              <OrgCard
                key={org.id}
                org={org}
                onUpdated={updated => setOrganismes(prev => prev.map(o => o.id === updated.id ? updated : o))}
                onDeleted={id => setOrganismes(prev => prev.filter(o => o.id !== id))}
              />
            ))
          )}
        </>
      )}

      {/* ── Onglet Tous les établissements ── */}
      {tab === 'tous' && (
        <>
          {allEtabs.length === 0 ? (
            <Card><div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
              <p>Aucun établissement dans votre périmètre.</p>
            </div></Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allEtabs.map(etab => (
                <div key={etab.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>{etab.nom}</p>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                      <span style={{ background: '#0097A722', color: '#0097A7', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600, marginRight: 6 }}>{etab._orgNom}</span>
                      {etab.adresse || 'Adresse non renseignée'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>👤 <b>{etab._count.users}</b></span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>🏊 <b>{etab._count.bassins}</b></span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>📊 <b>{etab._count.releves}</b></span>
                    {etab.abonnement && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                        background: `${STATUT_COLOR[etab.abonnement.statut]}22`,
                        color: STATUT_COLOR[etab.abonnement.statut] }}>
                        {etab.abonnement.statut}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
