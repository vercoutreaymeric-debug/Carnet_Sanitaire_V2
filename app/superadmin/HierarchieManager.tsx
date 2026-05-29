'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/Card'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Groupe    { id: number; nom: string; _count: { organismes: number; users: number } }
interface Organisme { id: number; nom: string; type: string; groupeId: number | null; groupe: { id: number; nom: string } | null; _count: { etablissements: number; users: number } }
interface Abonnement { plan: string; statut: string; dateExpiration: string | Date }
interface Etablissement {
  id: number; nom: string; adresse: string; organismeId: number | null
  organisme: { id: number; nom: string; groupe: { id: number; nom: string } | null } | null
  abonnement: Abonnement | null
  _count: { users: number; bassins: number; releves: number }
}
interface UserRow {
  id: number; username: string; nom: string; role: string
  etablissementId: number | null; organismeId: number | null; groupeId: number | null
}
interface Bassin {
  id: number; nom: string; type: string; etablissementId: number
  _count: { releves: number }
}

// ─── Couleurs ─────────────────────────────────────────────────────────────────
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
  superadmin: '#9333ea', responsable_groupe: '#0097A7', responsable_organisme: '#00aeef',
  responsable_etablissement: '#10b981', responsable_saisie: '#f97316',
  visualisateur: '#6b7280', controleur_ars: '#1e40af',
}
const STATUT_COLOR: Record<string, string> = {
  actif: '#10b981', essai: '#f59e0b', suspendu: '#f97316', expiré: '#ef4444',
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: `${color}18`, color, border: `1px solid ${color}33`,
    }}>{label}</span>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────
type Level = 'groupes' | 'organismes' | 'etablissements' | 'bassins'

export default function HierarchieManager() {
  const [data, setData]     = useState<{ groupes: Groupe[]; organismes: Organisme[]; etablissements: Etablissement[]; users: UserRow[]; bassins: Bassin[] } | null>(null)
  const [loading, setLoading] = useState(true)

  // Navigation drill-down
  const [level, setLevel]           = useState<Level>('groupes')
  const [selGroupe, setSelGroupe]   = useState<Groupe | null>(null)
  const [selOrg, setSelOrg]         = useState<Organisme | null>(null)
  const [selEtab, setSelEtab]       = useState<Etablissement | null>(null)
  const [search, setSearch]         = useState('')
  const [globalSearch, setGlobalSearch] = useState('')

  useEffect(() => {
    fetch('/api/superadmin/hierarchie')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function goToGroupes() { setLevel('groupes'); setSelGroupe(null); setSelOrg(null); setSelEtab(null); setSearch('') }
  function goToOrganismes(g: Groupe) { setLevel('organismes'); setSelGroupe(g); setSelOrg(null); setSelEtab(null); setSearch('') }
  function goToEtablissements(o: Organisme) { setLevel('etablissements'); setSelOrg(o); setSelEtab(null); setSearch('') }
  function goToBassins(e: Etablissement) { setLevel('bassins'); setSelEtab(e); setSearch('') }

  if (loading) return <Card><p style={{ color: 'var(--text3)', fontSize: 13 }}>Chargement…</p></Card>
  if (!data)   return <Card><p style={{ color: '#ef4444', fontSize: 13 }}>Erreur de chargement.</p></Card>

  // Recherche globale (tous niveaux)
  const gq = globalSearch.toLowerCase()
  const globalResults = gq ? {
    groupes:        data.groupes.filter(g => g.nom.toLowerCase().includes(gq)),
    organismes:     data.organismes.filter(o => o.nom.toLowerCase().includes(gq)),
    etablissements: data.etablissements.filter(e => e.nom.toLowerCase().includes(gq) || (e.adresse || '').toLowerCase().includes(gq)),
    bassins:        data.bassins.filter(b => b.nom.toLowerCase().includes(gq)),
    users:          data.users.filter(u => u.username.toLowerCase().includes(gq) || u.nom.toLowerCase().includes(gq)),
  } : null

  // Données filtrées selon le niveau + recherche locale
  const q = search.toLowerCase()
  const organismes     = data.organismes.filter(o => (!selGroupe || o.groupeId === selGroupe.id) && (!q || o.nom.toLowerCase().includes(q)))
  const etablissements = data.etablissements.filter(e => (!selOrg || e.organismeId === selOrg.id) && (!q || e.nom.toLowerCase().includes(q)))
  const bassins        = data.bassins.filter(b => (!selEtab || b.etablissementId === selEtab.id) && (!q || b.nom.toLowerCase().includes(q)))
  const groupes        = data.groupes.filter(g => !q || g.nom.toLowerCase().includes(q))
  const usersEtab      = selEtab ? data.users.filter(u => u.etablissementId === selEtab.id) : []

  const row = (onClick?: () => void) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', borderBottom: '1px solid var(--border)',
    cursor: onClick ? 'pointer' : 'default',
    background: 'var(--surface)',
    transition: 'background 0.15s',
  } as React.CSSProperties)

  return (
    <Card>
      {/* ── Titre + recherche globale ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, flexShrink: 0 }}>Vue hiérarchique</h3>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <input
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Recherche générale…"
            style={{
              width: '100%', padding: '7px 32px 7px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: 13, boxSizing: 'border-box',
            }}
          />
          {globalSearch && (
            <button onClick={() => setGlobalSearch('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text3)',
            }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Résultats recherche globale ── */}
      {globalResults && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          {(['groupes', 'organismes', 'etablissements', 'bassins', 'users'] as const).map(type => {
            const items = globalResults[type]
            if (!items.length) return null
            const labels: Record<string, string> = { groupes: 'Groupes', organismes: 'Organismes', etablissements: 'Établissements', bassins: 'Bassins', users: 'Utilisateurs' }
            return (
              <div key={type}>
                <div style={{ padding: '6px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {labels[type]} ({items.length})
                  </span>
                </div>
                {(items as any[]).map((item: any) => (
                  <div key={item.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{item.nom ?? item.username}</p>
                      {item.nom && item.username && <p style={{ fontSize: 11, color: 'var(--text3)' }}>{item.nom}</p>}
                      {type === 'etablissements' && item.organisme && (
                        <p style={{ fontSize: 11, color: 'var(--text3)' }}>{item.organisme.nom}{item.organisme.groupe ? ` › ${item.organisme.groupe.nom}` : ''}</p>
                      )}
                      {type === 'organismes' && item.groupe && (
                        <p style={{ fontSize: 11, color: 'var(--text3)' }}>{item.groupe.nom}</p>
                      )}
                    </div>
                    {type === 'users' && <Badge label={ROLE_LABEL[item.role] ?? item.role} color={ROLE_COLOR[item.role] ?? '#6b7280'} />}
                    {type === 'etablissements' && item.abonnement && <Badge label={item.abonnement.statut} color={STATUT_COLOR[item.abonnement.statut] ?? '#6b7280'} />}
                  </div>
                ))}
              </div>
            )
          })}
          {Object.values(globalResults).every(arr => arr.length === 0) && (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Aucun résultat pour "{globalSearch}"</p>
          )}
        </div>
      )}

      {/* ── Titre + fil d'ariane ── */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text2)' }}>Navigation</h3>

        {/* Fil d'ariane cliquable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <BreadcrumbItem label="Groupes" active={level === 'groupes'} onClick={goToGroupes} />
          {selGroupe && <>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>›</span>
            <BreadcrumbItem label={selGroupe.nom} active={level === 'organismes'} onClick={() => { setLevel('organismes'); setSelOrg(null); setSelEtab(null) }} />
          </>}
          {selOrg && <>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>›</span>
            <BreadcrumbItem label={selOrg.nom} active={level === 'etablissements'} onClick={() => { setLevel('etablissements'); setSelEtab(null) }} />
          </>}
          {selEtab && <>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>›</span>
            <BreadcrumbItem label={selEtab.nom} active={level === 'bassins'} onClick={() => setLevel('bassins')} />
          </>}
        </div>
      </div>

      {/* ── Mini-onglets ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {(['groupes', 'organismes', 'etablissements', 'bassins'] as Level[]).map(l => {
          const labels: Record<Level, string> = { groupes: 'Groupes', organismes: 'Organismes', etablissements: 'Établissements', bassins: 'Bassins' }
          const counts: Record<Level, number> = {
            groupes: groupes.length,
            organismes: organismes.length,
            etablissements: etablissements.length,
            bassins: bassins.length,
          }
          const active = level === l
          return (
            <button key={l} onClick={() => setLevel(l)} style={{
              padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: active ? 700 : 400,
              background: 'transparent',
              color: active ? '#00aeef' : 'var(--text3)',
              borderBottom: active ? '2px solid #00aeef' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {labels[l]} <span style={{ fontSize: 11, opacity: 0.7 }}>({counts[l]})</span>
            </button>
          )
        })}
      </div>

      {/* ── Barre de recherche ── */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          style={{
            width: '100%', padding: '8px 36px 8px 12px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text)', fontSize: 13, boxSizing: 'border-box',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text3)',
          }}>✕</button>
        )}
      </div>

      {/* ── Contenu ── */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>

        {/* GROUPES */}
        {level === 'groupes' && (
          groupes.length === 0
            ? <Empty msg="Aucun groupe." />
            : groupes.map(g => (
              <div key={g.id} onClick={() => goToOrganismes(g)}
                style={row(goToOrganismes)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{g.nom}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    {g._count.organismes} organisme(s) · {data.users.filter(u => u.groupeId === g.id).length} responsable(s)
                  </p>
                </div>
                <span style={{ fontSize: 18, color: 'var(--text3)' }}>›</span>
              </div>
            ))
        )}

        {/* ORGANISMES */}
        {level === 'organismes' && (
          organismes.length === 0
            ? <Empty msg="Aucun organisme dans ce groupe." />
            : organismes.map(o => (
              <div key={o.id} onClick={() => goToEtablissements(o)}
                style={row(goToEtablissements)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{o.nom}</p>
                    <Badge label={o.type} color="#6b7280" />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {o._count.etablissements} établissement(s) · {data.users.filter(u => u.organismeId === o.id).map(u => u.username).join(', ') || 'aucun responsable'}
                  </p>
                </div>
                <span style={{ fontSize: 18, color: 'var(--text3)' }}>›</span>
              </div>
            ))
        )}

        {/* ÉTABLISSEMENTS */}
        {level === 'etablissements' && (
          etablissements.length === 0
            ? <Empty msg="Aucun établissement dans cet organisme." />
            : etablissements.map(e => (
              <div key={e.id} onClick={() => goToBassins(e)}
                style={row(goToBassins)}
                onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={ev => (ev.currentTarget.style.background = 'var(--surface)')}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{e.nom}</p>
                    {e.abonnement && <>
                      <Badge label={e.abonnement.plan} color="#9333ea" />
                      <Badge label={e.abonnement.statut} color={STATUT_COLOR[e.abonnement.statut] ?? '#6b7280'} />
                    </>}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {e._count.bassins} bassin(s) · {e._count.users} utilisateur(s) · {e._count.releves} relevé(s)
                    {e.abonnement && ` · expire le ${new Date(e.abonnement.dateExpiration).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                <span style={{ fontSize: 18, color: 'var(--text3)' }}>›</span>
              </div>
            ))
        )}

        {/* BASSINS + UTILISATEURS */}
        {level === 'bassins' && selEtab && (<>
          {/* Bassins */}
          {bassins.length === 0
            ? <Empty msg="Aucun bassin dans cet établissement." />
            : bassins.map(b => (
              <div key={b.id} style={{ ...row(), cursor: 'default' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{b.nom}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    {b.type} · {b._count.releves} relevé(s)
                  </p>
                </div>
                <Badge label="Bassin" color="#10b981" />
              </div>
            ))
          }

          {/* Séparateur utilisateurs */}
          {usersEtab.length > 0 && (
            <div style={{ padding: '8px 16px', background: 'var(--surface2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Utilisateurs ({usersEtab.length})
              </p>
            </div>
          )}
          {usersEtab.map(u => (
            <div key={u.id} style={{ ...row(), cursor: 'default' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{u.username}</p>
                {u.nom && <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{u.nom}</p>}
              </div>
              <Badge label={ROLE_LABEL[u.role] ?? u.role} color={ROLE_COLOR[u.role] ?? '#6b7280'} />
            </div>
          ))}
        </>)}
      </div>
    </Card>
  )
}

function BreadcrumbItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
      fontSize: 13, fontWeight: active ? 700 : 400,
      color: active ? '#00aeef' : 'var(--text3)',
      background: active ? '#00aeef11' : 'transparent',
    } as React.CSSProperties}>
      {label}
    </button>
  )
}

function Empty({ msg }: { msg: string }) {
  return <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>{msg}</p>
}
