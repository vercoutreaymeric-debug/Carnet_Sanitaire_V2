'use client'
import { useState, useEffect, useMemo } from 'react'
import Card from '@/components/Card'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Groupe    { id: number; nom: string; _count: { organismes: number; users: number } }
interface Organisme { id: number; nom: string; type: string; groupeId: number | null; groupe: { id: number; nom: string } | null; _count: { etablissements: number; users: number } }
interface Abonnement { plan: string; statut: string; dateExpiration: string | Date; maxBassins: number; maxUtilisateurs: number }
interface Etablissement {
  id: number; nom: string; adresse: string; organismeId: number | null
  organisme: { id: number; nom: string; groupe: { id: number; nom: string } | null } | null
  abonnement: Abonnement | null
  _count: { users: number; bassins: number; releves: number }
}
interface UserRow {
  id: number; username: string; nom: string; role: string; email: string; createdAt: string
  etablissementId: number | null
  etablissement: { id: number; nom: string; organismeId: number | null; organisme: { id: number; nom: string; groupeId: number | null; groupe: { id: number; nom: string } | null } | null } | null
  organismeId: number | null
  organisme: { id: number; nom: string; groupeId: number | null; groupe: { id: number; nom: string } | null } | null
  groupeId: number | null
  groupe: { id: number; nom: string } | null
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  responsable_groupe: 'Resp. Groupe',
  responsable_organisme: 'Resp. Organisme',
  responsable_etablissement: 'Resp. Établissement',
  responsable_saisie: 'Resp. Saisie',
  visualisateur: 'Auditeur',
  controleur_ars: 'Contrôleur ARS',
}
const ROLE_COLOR: Record<string, string> = {
  superadmin: '#9333ea',
  responsable_groupe: '#0097A7',
  responsable_organisme: '#00aeef',
  responsable_etablissement: '#10b981',
  responsable_saisie: '#f97316',
  visualisateur: '#6b7280',
  controleur_ars: '#1e40af',
}
const STATUT_COLOR: Record<string, string> = {
  actif: '#10b981', essai: '#f59e0b', suspendu: '#f97316', expiré: '#ef4444',
}
const PLANS = ['Tous les plans', 'Starter', 'Pro', 'Intégral', 'Sur-mesure']
const STATUTS = ['Tous les statuts', 'actif', 'essai', 'suspendu', 'expiré']
const ROLES = ['Tous les rôles', ...Object.keys(ROLE_LABEL)]

// ─── Helpers ───────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: `${color}22`, color, border: `1px solid ${color}44`,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function Sel({ value, onChange, options, style }: { value: string; onChange: (v: string) => void; options: string[]; style?: React.CSSProperties }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)',
      background: 'var(--surface)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
      ...style,
    }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function HierarchieManager() {
  const [data, setData]       = useState<{ groupes: Groupe[]; organismes: Organisme[]; etablissements: Etablissement[]; users: UserRow[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'arbre' | 'etabs' | 'users'>('arbre')

  // Filtres communs
  const [search,       setSearch]       = useState('')
  const [filtreGroupe, setFiltreGroupe] = useState('Tous les groupes')
  const [filtreOrg,    setFiltreOrg]    = useState('Tous les organismes')
  // Filtres établissements
  const [filtrePlan,   setFiltrePlan]   = useState('Tous les plans')
  const [filtreStatut, setFiltreStatut] = useState('Tous les statuts')
  // Filtres utilisateurs
  const [filtreRole,   setFiltreRole]   = useState('Tous les rôles')
  // Vue arbre : accordéons ouverts
  const [openGroupes, setOpenGroupes]   = useState<Set<number>>(new Set())
  const [openOrgs,    setOpenOrgs]      = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch('/api/superadmin/hierarchie')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ── Options dynamiques des dropdowns ─────────────────────────────────────────
  const groupeOptions  = useMemo(() => ['Tous les groupes',  ...(data?.groupes.map(g => g.nom) ?? [])], [data])
  const orgOptions     = useMemo(() => {
    const base = data?.organismes ?? []
    const filtered = filtreGroupe === 'Tous les groupes' ? base : base.filter(o => o.groupe?.nom === filtreGroupe)
    return ['Tous les organismes', ...filtered.map(o => o.nom)]
  }, [data, filtreGroupe])

  // ── Filtrage établissements ────────────────────────────────────────────────
  const etabsFiltres = useMemo(() => {
    if (!data) return []
    return data.etablissements.filter(e => {
      const q = search.toLowerCase()
      if (q && !e.nom.toLowerCase().includes(q) && !(e.organisme?.nom ?? '').toLowerCase().includes(q) && !(e.organisme?.groupe?.nom ?? '').toLowerCase().includes(q)) return false
      if (filtreGroupe !== 'Tous les groupes' && e.organisme?.groupe?.nom !== filtreGroupe) return false
      if (filtreOrg !== 'Tous les organismes' && e.organisme?.nom !== filtreOrg) return false
      if (filtrePlan !== 'Tous les plans' && e.abonnement?.plan !== filtrePlan) return false
      if (filtreStatut !== 'Tous les statuts' && e.abonnement?.statut !== filtreStatut) return false
      return true
    })
  }, [data, search, filtreGroupe, filtreOrg, filtrePlan, filtreStatut])

  // ── Filtrage utilisateurs ─────────────────────────────────────────────────
  const usersFiltres = useMemo(() => {
    if (!data) return []
    return data.users.filter(u => {
      const q = search.toLowerCase()
      const etabNom  = u.etablissement?.nom ?? ''
      const orgNom   = (u.organisme?.nom ?? u.etablissement?.organisme?.nom ?? '')
      const grpNom   = (u.groupe?.nom ?? u.organisme?.groupe?.nom ?? u.etablissement?.organisme?.groupe?.nom ?? '')
      if (q && !u.username.toLowerCase().includes(q) && !u.nom.toLowerCase().includes(q) && !etabNom.toLowerCase().includes(q) && !orgNom.toLowerCase().includes(q)) return false
      if (filtreGroupe !== 'Tous les groupes' && grpNom !== filtreGroupe) return false
      if (filtreOrg !== 'Tous les organismes' && orgNom !== filtreOrg) return false
      if (filtreRole !== 'Tous les rôles' && u.role !== filtreRole) return false
      return true
    })
  }, [data, search, filtreGroupe, filtreOrg, filtreRole])

  // ── Reset org si groupe change ─────────────────────────────────────────────
  useEffect(() => { setFiltreOrg('Tous les organismes') }, [filtreGroupe])

  const inp = { padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12 }

  if (loading) return <Card><p style={{ color: 'var(--text3)', fontSize: 13 }}>Chargement de la hiérarchie…</p></Card>
  if (!data)   return <Card><p style={{ color: '#ef4444', fontSize: 13 }}>Erreur de chargement.</p></Card>

  return (
    <Card>
      {/* ── Titre ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>Vue hiérarchique</h3>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
          {data.groupes.length} groupe(s) · {data.organismes.length} organisme(s) · {data.etablissements.length} étab(s) · {data.users.length} user(s)
        </span>
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <input
          placeholder="Rechercher…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp, minWidth: 180, flex: 1 }}
        />
        <Sel value={filtreGroupe} onChange={setFiltreGroupe} options={groupeOptions} />
        <Sel value={filtreOrg}    onChange={setFiltreOrg}    options={orgOptions} />
        {tab === 'etabs' && <>
          <Sel value={filtrePlan}   onChange={setFiltrePlan}   options={PLANS} />
          <Sel value={filtreStatut} onChange={setFiltreStatut} options={STATUTS} />
        </>}
        {tab === 'users' && (
          <Sel value={filtreRole} onChange={setFiltreRole} options={ROLES} />
        )}
        {(search || filtreGroupe !== 'Tous les groupes' || filtreOrg !== 'Tous les organismes' || filtrePlan !== 'Tous les plans' || filtreStatut !== 'Tous les statuts' || filtreRole !== 'Tous les rôles') && (
          <button onClick={() => { setSearch(''); setFiltreGroupe('Tous les groupes'); setFiltreOrg('Tous les organismes'); setFiltrePlan('Tous les plans'); setFiltreStatut('Tous les statuts'); setFiltreRole('Tous les rôles') }}
            style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}>
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {([['arbre', 'Vue arbre'], ['etabs', 'Établissements'], ['users', 'Utilisateurs']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === key ? 700 : 400,
            background: tab === key ? '#00aeef22' : 'var(--surface2)',
            color: tab === key ? '#00aeef' : 'var(--text2)',
            borderBottom: tab === key ? '2px solid #00aeef' : '2px solid transparent',
          }}>{label}</button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          VUE ARBRE
      ════════════════════════════════════════════════════════════ */}
      {tab === 'arbre' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Établissements sans organisme */}
          {(() => {
            const sans = data.etablissements.filter(e => !e.organismeId && (
              filtreGroupe === 'Tous les groupes' && filtreOrg === 'Tous les organismes' &&
              (!search || e.nom.toLowerCase().includes(search.toLowerCase()))
            ))
            if (!sans.length) return null
            return (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: 'var(--surface2)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>Sans organisme ({sans.length} étab{sans.length > 1 ? 's' : ''})</span>
                </div>
                {sans.map(e => <EtabRow key={e.id} e={e} />)}
              </div>
            )
          })()}

          {/* Organismes sans groupe */}
          {data.organismes
            .filter(o => !o.groupeId && (filtreGroupe === 'Tous les groupes') && (filtreOrg === 'Tous les organismes' || o.nom === filtreOrg))
            .filter(o => !search || o.nom.toLowerCase().includes(search.toLowerCase()) || data.etablissements.some(e => e.organismeId === o.id && e.nom.toLowerCase().includes(search.toLowerCase())))
            .map(org => {
              const etabs = data.etablissements.filter(e => e.organismeId === org.id && (!search || e.nom.toLowerCase().includes(search.toLowerCase())))
              const isOpen = openOrgs.has(org.id)
              return (
                <div key={org.id} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <OrgHeader org={org} etabs={etabs} users={data.users.filter(u => u.organismeId === org.id)} isOpen={isOpen}
                    toggle={() => setOpenOrgs(s => { const n = new Set(s); isOpen ? n.delete(org.id) : n.add(org.id); return n })} />
                  {isOpen && etabs.map(e => <EtabRow key={e.id} e={e} users={data.users.filter(u => u.etablissementId === e.id)} indent />)}
                </div>
              )
            })
          }

          {/* Groupes */}
          {data.groupes
            .filter(g => filtreGroupe === 'Tous les groupes' || g.nom === filtreGroupe)
            .filter(g => !search || g.nom.toLowerCase().includes(search.toLowerCase()) ||
              data.organismes.some(o => o.groupeId === g.id && (o.nom.toLowerCase().includes(search.toLowerCase()) || data.etablissements.some(e => e.organismeId === o.id && e.nom.toLowerCase().includes(search.toLowerCase()))))
            )
            .map(grp => {
              const orgsInGrp = data.organismes.filter(o => o.groupeId === grp.id && (filtreOrg === 'Tous les organismes' || o.nom === filtreOrg))
              const isOpen = openGroupes.has(grp.id)
              return (
                <div key={grp.id} style={{ border: '1px solid #0097A744', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Header groupe */}
                  <div onClick={() => setOpenGroupes(s => { const n = new Set(s); isOpen ? n.delete(grp.id) : n.add(grp.id); return n })}
                    style={{ background: '#0097A711', padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#0097A7' }}>{isOpen ? '▾' : '▸'} {grp.nom}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 4 }}>
                      {grp._count.organismes} organisme(s) · {data.users.filter(u => u.groupeId === grp.id).length} resp.
                    </span>
                    {data.users.filter(u => u.groupeId === grp.id).map(u => (
                      <Badge key={u.id} label={u.username} color="#0097A7" />
                    ))}
                  </div>
                  {/* Organismes du groupe */}
                  {isOpen && orgsInGrp.map(org => {
                    const etabs = data.etablissements.filter(e => e.organismeId === org.id && (!search || e.nom.toLowerCase().includes(search.toLowerCase())))
                    const isOrgOpen = openOrgs.has(org.id)
                    return (
                      <div key={org.id} style={{ marginLeft: 20, borderLeft: '2px solid #0097A733' }}>
                        <OrgHeader org={org} etabs={etabs} users={data.users.filter(u => u.organismeId === org.id)} isOpen={isOrgOpen}
                          toggle={() => setOpenOrgs(s => { const n = new Set(s); isOrgOpen ? n.delete(org.id) : n.add(org.id); return n })} />
                        {isOrgOpen && etabs.map(e => <EtabRow key={e.id} e={e} users={data.users.filter(u => u.etablissementId === e.id)} indent />)}
                      </div>
                    )
                  })}
                  {isOpen && orgsInGrp.length === 0 && (
                    <p style={{ padding: '10px 20px', fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Aucun organisme dans ce groupe.</p>
                  )}
                </div>
              )
            })
          }
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VUE ÉTABLISSEMENTS
      ════════════════════════════════════════════════════════════ */}
      {tab === 'etabs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* Entête */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.2fr 1fr 1fr 80px 80px 80px', gap: 8, padding: '8px 14px', background: 'var(--surface2)', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Établissement</span><span>Organisme → Groupe</span><span>Plan / Statut</span><span>Expiration</span><span>Resp. étab</span><span style={{ textAlign: 'center' }}>Users</span><span style={{ textAlign: 'center' }}>Bassins</span><span style={{ textAlign: 'center' }}>Relevés</span>
          </div>
          {etabsFiltres.length === 0 && (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Aucun établissement ne correspond aux filtres.</p>
          )}
          {etabsFiltres.map((e, i) => {
            const resp = data.users.find(u => u.etablissementId === e.id && u.role === 'responsable_etablissement')
            return (
              <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.2fr 1fr 1fr 80px 80px 80px', gap: 8, padding: '10px 14px', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', alignItems: 'center', fontSize: 13 }}>
                <div>
                  <p style={{ fontWeight: 700 }}>{e.nom}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)' }}>{e.adresse || '—'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12 }}>{e.organisme?.nom ?? <span style={{ color: 'var(--text3)' }}>—</span>}</p>
                  {e.organisme?.groupe && <p style={{ fontSize: 11, color: '#0097A7' }}>{e.organisme.groupe.nom}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {e.abonnement ? <>
                    <Badge label={e.abonnement.plan} color="#9333ea" />
                    <Badge label={e.abonnement.statut} color={STATUT_COLOR[e.abonnement.statut] ?? '#6b7280'} />
                  </> : <span style={{ fontSize: 11, color: 'var(--text3)' }}>Pas d'abonnement</span>}
                </div>
                <span style={{ fontSize: 12, color: e.abonnement ? (new Date(e.abonnement.dateExpiration) < new Date() ? '#ef4444' : 'var(--text)') : 'var(--text3)' }}>
                  {e.abonnement ? new Date(e.abonnement.dateExpiration).toLocaleDateString('fr-FR') : '—'}
                </span>
                <span style={{ fontSize: 12, color: resp ? '#10b981' : 'var(--text3)' }}>
                  {resp ? resp.username : 'Aucun'}
                </span>
                <span style={{ textAlign: 'center', fontWeight: 700, color: '#00aeef' }}>{e._count.users}</span>
                <span style={{ textAlign: 'center', fontWeight: 700, color: '#10b981' }}>{e._count.bassins}</span>
                <span style={{ textAlign: 'center', fontWeight: 700, color: '#f97316' }}>{e._count.releves}</span>
              </div>
            )
          })}
          {etabsFiltres.length > 0 && (
            <div style={{ padding: '8px 14px', background: 'var(--surface2)', fontSize: 12, color: 'var(--text3)', borderTop: '1px solid var(--border)' }}>
              {etabsFiltres.length} établissement(s) · {etabsFiltres.reduce((s, e) => s + e._count.users, 0)} utilisateurs · {etabsFiltres.reduce((s, e) => s + e._count.bassins, 0)} bassins · {etabsFiltres.reduce((s, e) => s + e._count.releves, 0)} relevés
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          VUE UTILISATEURS
      ════════════════════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* Entête */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1.2fr 1.2fr 1fr', gap: 8, padding: '8px 14px', background: 'var(--surface2)', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Identifiant</span><span>Rôle</span><span>Établissement</span><span>Organisme</span><span>Groupe</span><span>Créé le</span>
          </div>
          {usersFiltres.length === 0 && (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Aucun utilisateur ne correspond aux filtres.</p>
          )}
          {usersFiltres.map((u, i) => {
            const orgNom  = u.organisme?.nom ?? u.etablissement?.organisme?.nom ?? null
            const grpNom  = u.groupe?.nom ?? u.organisme?.groupe?.nom ?? u.etablissement?.organisme?.groupe?.nom ?? null
            const etabNom = u.etablissement?.nom ?? null
            const color   = ROLE_COLOR[u.role] ?? '#6b7280'
            return (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1.2fr 1.2fr 1fr', gap: 8, padding: '10px 14px', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', alignItems: 'center', fontSize: 13 }}>
                <div>
                  <p style={{ fontWeight: 700 }}>{u.username}</p>
                  {u.nom && <p style={{ fontSize: 11, color: 'var(--text3)' }}>{u.nom}</p>}
                  {u.email && <p style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</p>}
                </div>
                <Badge label={ROLE_LABEL[u.role] ?? u.role} color={color} />
                <span style={{ fontSize: 12 }}>{etabNom ?? <span style={{ color: 'var(--text3)' }}>—</span>}</span>
                <span style={{ fontSize: 12 }}>{orgNom  ?? <span style={{ color: 'var(--text3)' }}>—</span>}</span>
                <span style={{ fontSize: 12, color: grpNom ? '#0097A7' : 'var(--text3)' }}>{grpNom ?? '—'}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            )
          })}
          {usersFiltres.length > 0 && (
            <div style={{ padding: '8px 14px', background: 'var(--surface2)', fontSize: 12, color: 'var(--text3)', borderTop: '1px solid var(--border)' }}>
              {usersFiltres.length} utilisateur(s) · {Object.entries(
                usersFiltres.reduce<Record<string, number>>((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc }, {})
              ).map(([r, n]) => `${n} ${ROLE_LABEL[r] ?? r}`).join(' · ')}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Sous-composants ───────────────────────────────────────────────────────────
function OrgHeader({ org, etabs, users, isOpen, toggle }: { org: Organisme; etabs: Etablissement[]; users: UserRow[]; isOpen: boolean; toggle: () => void }) {
  return (
    <div onClick={toggle} style={{ background: '#00aeef11', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 700, fontSize: 13, color: '#00aeef' }}>{isOpen ? '▾' : '▸'} {org.nom}</span>
      <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', padding: '1px 7px', borderRadius: 10 }}>{org.type}</span>
      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{etabs.length} étab{etabs.length > 1 ? 's' : ''}</span>
      {users.map(u => <Badge key={u.id} label={u.username} color="#00aeef" />)}
    </div>
  )
}

function EtabRow({ e, users, indent }: { e: Etablissement; users?: UserRow[]; indent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', marginLeft: indent ? 16 : 0, borderLeft: indent ? '2px solid #00aeef33' : undefined }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00aeef', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 120 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{e.nom}</span>
        {e.adresse && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>{e.adresse}</span>}
      </div>
      {e.abonnement && <><Badge label={e.abonnement.plan} color="#9333ea" /><Badge label={e.abonnement.statut} color={STATUT_COLOR[e.abonnement.statut] ?? '#6b7280'} /></>}
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
        {e._count.users} user(s) · {e._count.bassins} bassin(s) · {e._count.releves} relevé(s)
      </span>
      {users && users.map(u => (
        <Badge key={u.id} label={`${u.username} (${ROLE_LABEL[u.role] ?? u.role})`} color={ROLE_COLOR[u.role] ?? '#6b7280'} />
      ))}
    </div>
  )
}
