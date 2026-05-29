'use client'
import { useState } from 'react'
import Card from '@/components/Card'
import Btn from '@/components/Btn'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Abonnement { plan: string; statut: string; dateExpiration: string }
interface Etab {
  id: number; nom: string; adresse: string; telephone: string
  abonnement: Abonnement | null
  _count: { users: number; bassins: number; releves: number }
}
interface OrgUser { id: number; username: string; nom: string; email: string }
interface Organisme {
  id: number; nom: string; type: string; adresse: string; telephone: string
  etablissements: Etab[]; users: OrgUser[]
  _count: { etablissements: number }
}
interface Groupe { id: number; nom: string }

const STATUT_COLOR: Record<string, string> = {
  actif: '#10b981', essai: '#f59e0b', suspendu: '#f97316', expiré: '#ef4444',
}
const TYPE_OPTIONS = ['société', 'association', 'collectivité', 'EPCI', 'autre']

// ─── Constantes visuelles ─────────────────────────────────────────────────────
const C_GROUPE = '#0097A7'
const C_ORG    = '#00aeef'
const C_ETAB   = '#10b981'
const ORG_W    = 220  // px — largeur fixe carte organisme
const ETAB_W   = 200  // px — largeur fixe carte établissement
const GAP      = 16   // px — gap entre cartes

// ─── Formulaire input helper ──────────────────────────────────────────────────
const inp = (s?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', padding: '7px 11px', borderRadius: 7, border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', ...s,
})

// ─── Connecteur vertical ──────────────────────────────────────────────────────
function VLine({ color, h = 28 }: { color: string; h?: number }) {
  return <div style={{ width: 2, height: h, background: `${color}66`, flexShrink: 0, alignSelf: 'center' }} />
}

// ─── Ligne horizontale + enfants ─────────────────────────────────────────────
function HBranch({ children, lineColor, cardW }: { children: React.ReactNode[]; lineColor: string; cardW: number }) {
  const n = children.length
  if (n === 0) return null

  // Un seul enfant : juste une ligne verticale
  if (n === 1) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <VLine color={lineColor} />
      {children[0]}
    </div>
  )

  // Plusieurs enfants : ligne horizontale + branches verticales
  const totalW  = n * cardW + (n - 1) * GAP
  const halfCard = cardW / 2

  return (
    <div style={{ position: 'relative', display: 'flex', gap: GAP, justifyContent: 'center', paddingTop: 28 }}>
      {/* Ligne horizontale de centre à centre */}
      <div style={{
        position: 'absolute', top: 0,
        left: halfCard, right: halfCard,
        height: 2, background: `${lineColor}55`,
      }} />
      {children.map((child, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: cardW, flexShrink: 0 }}>
          <VLine color={lineColor} />
          {child}
        </div>
      ))}
    </div>
  )
}

// ─── Carte Groupe ─────────────────────────────────────────────────────────────
function GroupeNode({ groupe, nbOrgs, nbEtabs }: { groupe: Groupe | null; nbOrgs: number; nbEtabs: number }) {
  return (
    <div style={{
      background: `${C_GROUPE}18`, border: `2px solid ${C_GROUPE}44`,
      borderRadius: 12, padding: '14px 28px', textAlign: 'center', minWidth: 260,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C_GROUPE, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Groupe</p>
      <p style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>{groupe?.nom ?? 'Mon périmètre'}</p>
      <p style={{ fontSize: 12, color: 'var(--text3)' }}>{nbOrgs} organisme{nbOrgs !== 1 ? 's' : ''} · {nbEtabs} établissement{nbEtabs !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Carte Organisme ─────────────────────────────────────────────────────────
function OrgNode({ org, onEdit, onDelete, onAddEtab }: {
  org: Organisme
  onEdit: () => void
  onDelete: () => void
  onAddEtab: () => void
}) {
  return (
    <div style={{
      background: `${C_ORG}12`, border: `1.5px solid ${C_ORG}44`,
      borderRadius: 10, padding: '12px 14px', width: ORG_W, boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: C_ORG, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Organisme</p>
      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{org.nom}</p>
      <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
        {org.type} · {org.etablissements.length} étab{org.etablissements.length !== 1 ? 's' : ''}
        {org.users[0] ? ` · ${org.users[0].nom || org.users[0].username}` : ''}
      </p>
      <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between' }}>
        <button onClick={onAddEtab} style={{
          flex: 1, background: `${C_ETAB}22`, color: C_ETAB, border: `1px solid ${C_ETAB}44`,
          borderRadius: 6, padding: '4px 0', cursor: 'pointer', fontSize: 11, fontWeight: 600,
        }}>+ Étab</button>
        <button onClick={onEdit} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--text2)',
        }}>✏️</button>
        <button onClick={onDelete} style={{
          background: '#ef444415', border: '1px solid #ef444433',
          borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: '#ef4444',
        }}>🗑</button>
      </div>
    </div>
  )
}

// ─── Carte Établissement ──────────────────────────────────────────────────────
function EtabNode({ etab, onEdit, onDelete }: {
  etab: Etab; onEdit: () => void; onDelete: () => void
}) {
  const sc = etab.abonnement ? (STATUT_COLOR[etab.abonnement.statut] ?? '#6b7280') : '#6b7280'
  return (
    <div style={{
      background: `${C_ETAB}0e`, border: `1.5px solid ${C_ETAB}33`,
      borderRadius: 9, padding: '10px 12px', width: ETAB_W, boxSizing: 'border-box',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: C_ETAB, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Établissement</p>
      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>{etab.nom}</p>
      {etab.abonnement && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: '#9333ea18', color: '#9333ea', border: '1px solid #9333ea33', fontWeight: 600 }}>
            {etab.abonnement.plan}
          </span>
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: `${sc}18`, color: sc, border: `1px solid ${sc}33`, fontWeight: 600 }}>
            {etab.abonnement.statut}
          </span>
        </div>
      )}
      <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>
        {etab._count.users}u · {etab._count.bassins}b · {etab._count.releves}r
      </p>
      <div style={{ display: 'flex', gap: 5 }}>
        <button onClick={onEdit} style={{
          flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '3px 0', cursor: 'pointer', fontSize: 11, color: 'var(--text2)',
        }}>✏️ Modifier</button>
        <button onClick={onDelete} style={{
          background: '#ef444415', border: '1px solid #ef444433',
          borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: 11, color: '#ef4444',
        }}>🗑</button>
      </div>
    </div>
  )
}

// ─── Modal / formulaire inline ────────────────────────────────────────────────
function FormPanel({ title, color, children, onClose }: { title: string; color: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
      <div style={{ background: 'var(--card)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 520, border: `2px solid ${color}44`, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color }}>{title}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text3)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function GroupeView({ groupe, organismes: initOrgs, groupeId }: {
  groupe: Groupe | null; organismes: Organisme[]; groupeId: number | null
}) {
  const [organismes, setOrganismes] = useState(initOrgs)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  // États modaux
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [editOrg, setEditOrg]   = useState<Organisme | null>(null)
  const [deleteOrg, setDeleteOrg] = useState<Organisme | null>(null)
  const [createEtabOrgId, setCreateEtabOrgId] = useState<number | null>(null)
  const [editEtab, setEditEtab] = useState<{ orgId: number; etab: Etab } | null>(null)
  const [deleteEtab, setDeleteEtab] = useState<{ orgId: number; etab: Etab } | null>(null)

  // Formulaires
  const [createOrgForm, setCreateOrgForm] = useState({ nom: '', type: 'société', adresse: '', telephone: '', username: '', password: '', nomContact: '', email: '' })
  const [editOrgForm, setEditOrgForm]     = useState({ nom: '', type: 'société', adresse: '', telephone: '' })
  const [createEtabForm, setCreateEtabForm] = useState({ nom: '', adresse: '', telephone: '', adminUsername: '', adminPassword: '', adminNom: '', adminEmail: '' })
  const [editEtabForm, setEditEtabForm]   = useState({ nom: '', adresse: '', telephone: '' })

  const allEtabs = organismes.flatMap(o => o.etablissements)

  // ── CRUD Organisme ──────────────────────────────────────────────────────────
  async function creerOrganisme() {
    if (!createOrgForm.nom) return
    setLoading(true); setMsg(null)
    const r = await fetch('/api/groupe/organismes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...createOrgForm, groupeId }) })
    setLoading(false)
    const d = await r.json()
    if (r.ok) {
      setMsg({ text: `✅ "${createOrgForm.nom}" créé !`, ok: true })
      setShowCreateOrg(false)
      setCreateOrgForm({ nom: '', type: 'société', adresse: '', telephone: '', username: '', password: '', nomContact: '', email: '' })
      setOrganismes(prev => [...prev, { ...d, etablissements: [], users: [], _count: { etablissements: 0 } }])
    } else setMsg({ text: '❌ ' + (d.error || 'Erreur'), ok: false })
  }

  async function sauvegarderOrg() {
    if (!editOrg) return
    setLoading(true)
    const r = await fetch(`/api/groupe/organismes/${editOrg.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editOrgForm) })
    setLoading(false)
    if (r.ok) {
      setOrganismes(prev => prev.map(o => o.id === editOrg.id ? { ...o, ...editOrgForm } : o))
      setEditOrg(null); setMsg({ text: '✅ Organisme modifié', ok: true })
    } else { const d = await r.json(); setMsg({ text: '❌ ' + d.error, ok: false }) }
  }

  async function supprimerOrg(org: Organisme) {
    setLoading(true)
    const r = await fetch(`/api/groupe/organismes/${org.id}`, { method: 'DELETE' })
    setLoading(false); setDeleteOrg(null)
    if (r.ok) { setOrganismes(prev => prev.filter(o => o.id !== org.id)); setMsg({ text: `✅ "${org.nom}" supprimé`, ok: true }) }
    else { let e = 'Erreur'; try { e = (await r.json()).error } catch {}; setMsg({ text: '❌ ' + e, ok: false }) }
  }

  // ── CRUD Établissement ──────────────────────────────────────────────────────
  async function creerEtab() {
    if (!createEtabOrgId || !createEtabForm.nom || !createEtabForm.adminUsername || !createEtabForm.adminPassword) return
    setLoading(true)
    const r = await fetch('/api/organisme/etablissements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...createEtabForm, organismeId: createEtabOrgId }) })
    setLoading(false)
    const d = await r.json()
    if (r.ok) {
      const newEtab: Etab = { id: d.etab.id, nom: d.etab.nom, adresse: d.etab.adresse, telephone: d.etab.telephone, abonnement: null, _count: { users: 1, bassins: 0, releves: 0 } }
      setOrganismes(prev => prev.map(o => o.id === createEtabOrgId ? { ...o, etablissements: [...o.etablissements, newEtab], _count: { etablissements: o._count.etablissements + 1 } } : o))
      setCreateEtabOrgId(null)
      setCreateEtabForm({ nom: '', adresse: '', telephone: '', adminUsername: '', adminPassword: '', adminNom: '', adminEmail: '' })
      setMsg({ text: `✅ "${d.etab.nom}" créé !`, ok: true })
    } else setMsg({ text: '❌ ' + (d.error || 'Erreur'), ok: false })
  }

  async function sauvegarderEtab() {
    if (!editEtab) return
    setLoading(true)
    const r = await fetch(`/api/organisme/etablissements/${editEtab.etab.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editEtabForm) })
    setLoading(false)
    if (r.ok) {
      setOrganismes(prev => prev.map(o => o.id === editEtab.orgId ? { ...o, etablissements: o.etablissements.map(e => e.id === editEtab.etab.id ? { ...e, ...editEtabForm } : e) } : o))
      setEditEtab(null); setMsg({ text: '✅ Établissement modifié', ok: true })
    } else { const d = await r.json(); setMsg({ text: '❌ ' + d.error, ok: false }) }
  }

  async function supprimerEtab(orgId: number, etab: Etab) {
    setLoading(true)
    const r = await fetch(`/api/organisme/etablissements/${etab.id}`, { method: 'DELETE' })
    setLoading(false); setDeleteEtab(null)
    if (r.ok) {
      setOrganismes(prev => prev.map(o => o.id === orgId ? { ...o, etablissements: o.etablissements.filter(e => e.id !== etab.id), _count: { etablissements: o._count.etablissements - 1 } } : o))
      setMsg({ text: `✅ "${etab.nom}" supprimé`, ok: true })
    } else { let e = 'Erreur'; try { e = (await r.json()).error } catch {}; setMsg({ text: '❌ ' + e, ok: false }) }
  }

  return (
    <div style={{ padding: 24 }}>

      {/* Message */}
      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13, background: msg.ok ? '#10b98118' : '#ef444418', border: `1px solid ${msg.ok ? '#10b98144' : '#ef444444'}`, color: msg.ok ? '#10b981' : '#ef4444' }}>
          {msg.text}
        </div>
      )}

      {/* ─── ORGANIGRAMME ───────────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', paddingBottom: 24 }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: '100%' }}>

          {/* Nœud Groupe */}
          <GroupeNode groupe={groupe} nbOrgs={organismes.length} nbEtabs={allEtabs.length} />

          {/* Bouton créer organisme sous le groupe */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <VLine color={C_GROUPE} h={16} />
            <button onClick={() => setShowCreateOrg(true)} style={{
              background: `${C_GROUPE}18`, border: `1px dashed ${C_GROUPE}66`,
              borderRadius: 8, padding: '5px 16px', cursor: 'pointer', fontSize: 12,
              color: C_GROUPE, fontWeight: 600,
            }}>+ Ajouter un organisme</button>
          </div>

          {organismes.length > 0 && (
            <>
              <VLine color={C_ORG} h={20} />

              {/* Niveau Organismes */}
              <HBranch lineColor={C_ORG} cardW={ORG_W}>
                {organismes.map(org => (
                  <div key={org.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Carte Organisme */}
                    <OrgNode
                      org={org}
                      onEdit={() => { setEditOrg(org); setEditOrgForm({ nom: org.nom, type: org.type, adresse: org.adresse, telephone: org.telephone }) }}
                      onDelete={() => setDeleteOrg(org)}
                      onAddEtab={() => setCreateEtabOrgId(org.id)}
                    />

                    {/* Niveau Établissements */}
                    {org.etablissements.length > 0 && (
                      <HBranch lineColor={C_ETAB} cardW={ETAB_W}>
                        {org.etablissements.map(etab => (
                          <EtabNode
                            key={etab.id}
                            etab={etab}
                            onEdit={() => { setEditEtab({ orgId: org.id, etab }); setEditEtabForm({ nom: etab.nom, adresse: etab.adresse, telephone: etab.telephone }) }}
                            onDelete={() => setDeleteEtab({ orgId: org.id, etab })}
                          />
                        ))}
                      </HBranch>
                    )}
                  </div>
                ))}
              </HBranch>
            </>
          )}
        </div>
      </div>

      {/* ─── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Créer Organisme */}
      {showCreateOrg && (
        <FormPanel title="Nouvel organisme" color={C_ORG} onClose={() => setShowCreateOrg(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom *</label><input style={inp()} value={createOrgForm.nom} onChange={e => setCreateOrgForm(f => ({ ...f, nom: e.target.value }))} placeholder="Récréa Île-de-France" /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Type</label>
              <select style={inp()} value={createOrgForm.type} onChange={e => setCreateOrgForm(f => ({ ...f, type: e.target.value }))}>
                {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Téléphone</label><input style={inp()} value={createOrgForm.telephone} onChange={e => setCreateOrgForm(f => ({ ...f, telephone: e.target.value }))} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Adresse</label><input style={inp()} value={createOrgForm.adresse} onChange={e => setCreateOrgForm(f => ({ ...f, adresse: e.target.value }))} /></div>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Compte responsable (optionnel)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Identifiant</label><input style={inp()} value={createOrgForm.username} onChange={e => setCreateOrgForm(f => ({ ...f, username: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Mot de passe</label><input style={inp()} type="password" value={createOrgForm.password} onChange={e => setCreateOrgForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom affiché</label><input style={inp()} value={createOrgForm.nomContact} onChange={e => setCreateOrgForm(f => ({ ...f, nomContact: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Email</label><input style={inp()} type="email" value={createOrgForm.email} onChange={e => setCreateOrgForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn icon="save" onClick={creerOrganisme} disabled={loading || !createOrgForm.nom}>{loading ? 'Création...' : 'Créer'}</Btn>
            <Btn variant="ghost" onClick={() => setShowCreateOrg(false)}>Annuler</Btn>
          </div>
        </FormPanel>
      )}

      {/* Modifier Organisme */}
      {editOrg && (
        <FormPanel title={`Modifier — ${editOrg.nom}`} color={C_ORG} onClose={() => setEditOrg(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom</label><input style={inp()} value={editOrgForm.nom} onChange={e => setEditOrgForm(f => ({ ...f, nom: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Type</label>
              <select style={inp()} value={editOrgForm.type} onChange={e => setEditOrgForm(f => ({ ...f, type: e.target.value }))}>
                {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Téléphone</label><input style={inp()} value={editOrgForm.telephone} onChange={e => setEditOrgForm(f => ({ ...f, telephone: e.target.value }))} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Adresse</label><input style={inp()} value={editOrgForm.adresse} onChange={e => setEditOrgForm(f => ({ ...f, adresse: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn icon="save" onClick={sauvegarderOrg} disabled={loading}>Sauvegarder</Btn>
            <Btn variant="ghost" onClick={() => setEditOrg(null)}>Annuler</Btn>
          </div>
        </FormPanel>
      )}

      {/* Créer Établissement */}
      {createEtabOrgId !== null && (
        <FormPanel title={`Nouvel établissement — ${organismes.find(o => o.id === createEtabOrgId)?.nom}`} color={C_ETAB} onClose={() => setCreateEtabOrgId(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom *</label><input style={inp()} value={createEtabForm.nom} onChange={e => setCreateEtabForm(f => ({ ...f, nom: e.target.value }))} placeholder="Piscine Massy" /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Téléphone</label><input style={inp()} value={createEtabForm.telephone} onChange={e => setCreateEtabForm(f => ({ ...f, telephone: e.target.value }))} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Adresse</label><input style={inp()} value={createEtabForm.adresse} onChange={e => setCreateEtabForm(f => ({ ...f, adresse: e.target.value }))} /></div>
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Compte responsable établissement</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Identifiant *</label><input style={inp()} value={createEtabForm.adminUsername} onChange={e => setCreateEtabForm(f => ({ ...f, adminUsername: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Mot de passe *</label><input style={inp()} type="password" value={createEtabForm.adminPassword} onChange={e => setCreateEtabForm(f => ({ ...f, adminPassword: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom affiché</label><input style={inp()} value={createEtabForm.adminNom} onChange={e => setCreateEtabForm(f => ({ ...f, adminNom: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Email</label><input style={inp()} type="email" value={createEtabForm.adminEmail} onChange={e => setCreateEtabForm(f => ({ ...f, adminEmail: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn icon="save" onClick={creerEtab} disabled={loading || !createEtabForm.nom || !createEtabForm.adminUsername || !createEtabForm.adminPassword}>{loading ? 'Création...' : 'Créer'}</Btn>
            <Btn variant="ghost" onClick={() => setCreateEtabOrgId(null)}>Annuler</Btn>
          </div>
        </FormPanel>
      )}

      {/* Modifier Établissement */}
      {editEtab && (
        <FormPanel title={`Modifier — ${editEtab.etab.nom}`} color={C_ETAB} onClose={() => setEditEtab(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom</label><input style={inp()} value={editEtabForm.nom} onChange={e => setEditEtabForm(f => ({ ...f, nom: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Téléphone</label><input style={inp()} value={editEtabForm.telephone} onChange={e => setEditEtabForm(f => ({ ...f, telephone: e.target.value }))} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Adresse</label><input style={inp()} value={editEtabForm.adresse} onChange={e => setEditEtabForm(f => ({ ...f, adresse: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn icon="save" onClick={sauvegarderEtab} disabled={loading}>Sauvegarder</Btn>
            <Btn variant="ghost" onClick={() => setEditEtab(null)}>Annuler</Btn>
          </div>
        </FormPanel>
      )}

      {/* Supprimer Organisme */}
      {deleteOrg && (
        <ConfirmDeleteModal
          nom={deleteOrg.nom} type="Organisme" danger={2}
          details={[`${deleteOrg.etablissements.length} établissement(s) seront détachés (non supprimés)`]}
          onConfirm={() => supprimerOrg(deleteOrg)}
          onCancel={() => setDeleteOrg(null)}
        />
      )}

      {/* Supprimer Établissement */}
      {deleteEtab && (
        <ConfirmDeleteModal
          nom={deleteEtab.etab.nom} type="Établissement" danger={3}
          details={[
            `${deleteEtab.etab._count.bassins} bassin(s) et leurs relevés`,
            `${deleteEtab.etab._count.users} utilisateur(s)`,
            `${deleteEtab.etab._count.releves} relevé(s)`,
          ]}
          onConfirm={() => supprimerEtab(deleteEtab.orgId, deleteEtab.etab)}
          onCancel={() => setDeleteEtab(null)}
        />
      )}
    </div>
  )
}
