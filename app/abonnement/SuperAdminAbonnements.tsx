'use client'
import { useState } from 'react'
import Card from '@/components/Card'

// ── Types ────────────────────────────────────────────────────────────────────

interface Abonnement {
  plan: string; statut: string
  dateDebut: Date | string; dateExpiration: Date | string
  maxBassins: number; maxUtilisateurs: number
  notes: string; updatedAt: Date | string
}

interface Etab {
  id: number; nom: string; adresse: string; telephone: string
  createdAt: Date | string
  abonnement: Abonnement | null
  organisme: { id: number; nom: string; type: string; groupe: { id: number; nom: string } | null } | null
  _count: { bassins: number; users: number; releves: number }
}

interface Organisme {
  id: number; nom: string; type: string
  groupe: { id: number; nom: string } | null
  etablissements: Etab[]
}

interface Groupe {
  id: number; nom: string
  organismes: (Organisme & { etablissements: Etab[] })[]
}

interface Props {
  etablissements: Etab[]
  groupes: Groupe[]
  organismes: Organisme[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function joursRestants(dateExp: Date | string) {
  return Math.round((new Date(dateExp).getTime() - Date.now()) / 86400000)
}

const STATUT_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  actif:    { color: '#10b981', bg: '#10b98115', label: 'Actif' },
  essai:    { color: '#f59e0b', bg: '#f59e0b15', label: 'Essai' },
  suspendu: { color: '#f97316', bg: '#f9731615', label: 'Suspendu' },
  expiré:   { color: '#ef4444', bg: '#ef444415', label: 'Expiré' },
}

const PLAN_COLOR: Record<string, string> = {
  Starter: '#6b7280', Pro: '#00aeef', Intégral: '#9333ea', 'Sur-mesure': '#ec4899',
}

const TYPE_ORGANISME: Record<string, { label: string; color: string }> = {
  'société':       { label: 'Société',       color: '#00aeef' },
  'association':   { label: 'Association',   color: '#10b981' },
  'collectivité':  { label: 'Collectivité',  color: '#f59e0b' },
}

// ── Ligne de tableau établissement ───────────────────────────────────────────

function EtabRow({ e, showOrg = false }: { e: Etab; showOrg?: boolean }) {
  const abo = e.abonnement
  const statut = abo ? (STATUT_STYLE[abo.statut] ?? STATUT_STYLE['expiré']) : null
  const jr = abo ? joursRestants(abo.dateExpiration) : null
  const planColor = abo ? (PLAN_COLOR[abo.plan] ?? '#6b7280') : '#6b7280'
  const alertJr = jr !== null && jr <= 30 && jr > 0

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '11px 14px' }}>
        <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{e.nom}</p>
        {showOrg && e.organisme && (
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{e.organisme.nom}</p>
        )}
        {e.adresse && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{e.adresse}</p>}
      </td>
      <td style={{ padding: '11px 14px' }}>
        {abo ? <span style={{ fontWeight: 700, color: planColor, fontSize: 13 }}>{abo.plan}</span>
             : <span style={{ color: 'var(--text3)' }}>—</span>}
      </td>
      <td style={{ padding: '11px 14px' }}>
        {statut ? (
          <span style={{ background: statut.bg, color: statut.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {statut.label}
          </span>
        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
      </td>
      <td style={{ padding: '11px 14px', color: 'var(--text2)', whiteSpace: 'nowrap', fontSize: 12 }}>
        {abo ? fmt(abo.dateDebut) : '—'}
      </td>
      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', fontSize: 12 }}>
        {abo ? (
          <span style={{ color: jr !== null && jr <= 0 ? '#ef4444' : alertJr ? '#f59e0b' : 'var(--text)' }}>
            {fmt(abo.dateExpiration)}
          </span>
        ) : '—'}
      </td>
      <td style={{ padding: '11px 14px', textAlign: 'center' }}>
        {jr !== null ? (
          <span style={{ fontWeight: 700, fontSize: 13, color: jr <= 0 ? '#ef4444' : alertJr ? '#f59e0b' : '#10b981' }}>
            {jr <= 0 ? 'Expiré' : `${jr}j`}
          </span>
        ) : '—'}
      </td>
      <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 12 }}>
        <span style={{ fontWeight: 600 }}>{e._count.bassins}</span>
        {abo && <span style={{ color: 'var(--text3)', fontSize: 10 }}> /{abo.maxBassins === 999 ? '∞' : abo.maxBassins}</span>}
      </td>
      <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: 12 }}>
        <span style={{ fontWeight: 600 }}>{e._count.users}</span>
        {abo && <span style={{ color: 'var(--text3)', fontSize: 10 }}> /{abo.maxUtilisateurs === 999 ? '∞' : abo.maxUtilisateurs}</span>}
      </td>
      <td style={{ padding: '11px 14px', textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>
        {e._count.releves}
      </td>
    </tr>
  )
}

// ── En-tête de tableau ────────────────────────────────────────────────────────

const TABLE_HEADERS = ['Établissement', 'Plan', 'Statut', 'Début', 'Expiration', 'Restant', 'Bassins', 'Utilisateurs', 'Relevés']

function TableHeader() {
  return (
    <thead>
      <tr style={{ background: 'var(--surface2)' }}>
        {TABLE_HEADERS.map(h => (
          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
  )
}

// ── KPI mini (pour groupe/organisme) ─────────────────────────────────────────

function MiniKpis({ etabs }: { etabs: Etab[] }) {
  const actifs  = etabs.filter(e => e.abonnement?.statut === 'actif').length
  const essais  = etabs.filter(e => e.abonnement?.statut === 'essai').length
  const expires = etabs.filter(e => {
    if (!e.abonnement) return false
    const j = joursRestants(e.abonnement.dateExpiration)
    return j <= 30 && j > 0
  }).length

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{etabs.length} étab.</span>
      {actifs > 0  && <span style={{ fontSize: 11, background: '#10b98115', color: '#10b981', borderRadius: 10, padding: '1px 8px', fontWeight: 600 }}>{actifs} actif{actifs > 1 ? 's' : ''}</span>}
      {essais > 0  && <span style={{ fontSize: 11, background: '#f59e0b15', color: '#f59e0b', borderRadius: 10, padding: '1px 8px', fontWeight: 600 }}>{essais} essai{essais > 1 ? 's' : ''}</span>}
      {expires > 0 && <span style={{ fontSize: 11, background: '#ef444415', color: '#ef4444', borderRadius: 10, padding: '1px 8px', fontWeight: 600 }}>{expires} expire bientôt</span>}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function SuperAdminAbonnements({ etablissements, groupes, organismes }: Props) {
  const [tab, setTab] = useState<'tous' | 'groupes' | 'organismes'>('tous')
  const [openGroupes, setOpenGroupes] = useState<Set<number>>(new Set())
  const [openOrganismes, setOpenOrganismes] = useState<Set<number>>(new Set())

  const total   = etablissements.length
  const actifs  = etablissements.filter(e => e.abonnement?.statut === 'actif').length
  const essais  = etablissements.filter(e => e.abonnement?.statut === 'essai').length
  const expires = etablissements.filter(e => {
    if (!e.abonnement) return false
    const j = joursRestants(e.abonnement.dateExpiration)
    return j <= 30 && j > 0
  }).length

  function toggleGroupe(id: number) {
    setOpenGroupes(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  function toggleOrganisme(id: number) {
    setOpenOrganismes(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  // Établissements sans organisme
  const etabsSansOrganisme = etablissements.filter(e => !e.organisme)

  const tabs = [
    { key: 'tous',       label: 'Tous les abonnements', count: total },
    { key: 'groupes',    label: 'Par Groupe',            count: groupes.length },
    { key: 'organismes', label: 'Par Organisme',         count: organismes.length },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Abonnements clients</h2>
        <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Vue globale de tous les abonnements en cours</p>
      </div>

      {/* KPIs globaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Établissements', value: total,   color: 'var(--accent)' },
          { label: 'Actifs',         value: actifs,  color: '#10b981' },
          { label: 'En essai',       value: essais,  color: '#f59e0b' },
          { label: 'Expire bientôt', value: expires, color: '#ef4444' },
          { label: 'Groupes',        value: groupes.length,    color: '#0097A7' },
          { label: 'Organismes',     value: organismes.length, color: '#00aeef' },
        ].map(k => (
          <Card key={k.label} style={{ textAlign: 'center', padding: '14px 10px' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 5 }}>{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '9px 18px', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans',
              fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? 'var(--accent)' : 'var(--text2)',
              background: 'transparent',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 700, background: tab === t.key ? 'var(--accent)' : 'var(--surface2)',
              color: tab === t.key ? '#fff' : 'var(--text3)',
              borderRadius: 99, padding: '1px 7px',
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Tab : Tous ────────────────────────────────────────────────────── */}
      {tab === 'tous' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <TableHeader />
            <tbody>
              {etablissements.map(e => <EtabRow key={e.id} e={e} showOrg />)}
              {etablissements.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Aucun établissement</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Tab : Par Groupe ─────────────────────────────────────────────── */}
      {tab === 'groupes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {groupes.map(g => {
            const allEtabs = g.organismes.flatMap(o => o.etablissements)
            const isOpen = openGroupes.has(g.id)
            return (
              <Card key={g.id} style={{ padding: 0, overflow: 'hidden' }}>
                {/* En-tête groupe */}
                <button
                  onClick={() => toggleGroupe(g.id)}
                  style={{
                    width: '100%', padding: '14px 18px', background: '#0097A715',
                    border: 'none', borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#0097A7', color: '#fff', borderRadius: 6, padding: '2px 9px', letterSpacing: '0.04em' }}>
                        GROUPE
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{g.nom}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{g.organismes.length} organisme{g.organismes.length > 1 ? 's' : ''}</span>
                    </div>
                    <MiniKpis etabs={allEtabs as Etab[]} />
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: 18 }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div>
                    {g.organismes.map(o => (
                      <div key={o.id}>
                        {/* En-tête organisme dans le groupe */}
                        <div style={{
                          padding: '10px 18px 10px 28px',
                          background: 'var(--surface2)',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
                            background: (TYPE_ORGANISME[o.type]?.color ?? '#6b7280') + '20',
                            color: TYPE_ORGANISME[o.type]?.color ?? '#6b7280',
                          }}>
                            {(TYPE_ORGANISME[o.type]?.label ?? o.type).toUpperCase()}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{o.nom}</span>
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{o.etablissements.length} étab.</span>
                        </div>
                        {/* Tableau des étabs de cet organisme */}
                        {o.etablissements.length > 0 && (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <TableHeader />
                            <tbody>
                              {o.etablissements.map(e => (
                                <EtabRow key={e.id} e={e as Etab} />
                              ))}
                            </tbody>
                          </table>
                        )}
                        {o.etablissements.length === 0 && (
                          <p style={{ padding: '12px 28px', fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Aucun établissement</p>
                        )}
                      </div>
                    ))}
                    {g.organismes.length === 0 && (
                      <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>Aucun organisme dans ce groupe</p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}

          {/* Établissements sans groupe (via organisme sans groupe) */}
          {(() => {
            const etabsSansGroupe = etablissements.filter(e => !e.organisme?.groupe)
            if (etabsSansGroupe.length === 0) return null
            return (
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Sans groupe</span>
                  <MiniKpis etabs={etabsSansGroupe} />
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <TableHeader />
                  <tbody>{etabsSansGroupe.map(e => <EtabRow key={e.id} e={e} showOrg />)}</tbody>
                </table>
              </Card>
            )
          })()}

          {groupes.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text3)', padding: 40, fontSize: 13 }}>Aucun groupe créé</p>
          )}
        </div>
      )}

      {/* ── Tab : Par Organisme ───────────────────────────────────────────── */}
      {tab === 'organismes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {organismes.map(o => {
            const isOpen = openOrganismes.has(o.id)
            const typeStyle = TYPE_ORGANISME[o.type] ?? { label: o.type, color: '#6b7280' }
            return (
              <Card key={o.id} style={{ padding: 0, overflow: 'hidden' }}>
                {/* En-tête organisme */}
                <button
                  onClick={() => toggleOrganisme(o.id)}
                  style={{
                    width: '100%', padding: '13px 18px',
                    background: typeStyle.color + '12',
                    border: 'none', borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: typeStyle.color, color: '#fff', borderRadius: 6, padding: '2px 9px', letterSpacing: '0.04em' }}>
                        {typeStyle.label.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{o.nom}</span>
                      {o.groupe && (
                        <span style={{ fontSize: 11, background: '#0097A715', color: '#0097A7', borderRadius: 10, padding: '2px 9px', fontWeight: 600 }}>
                          Groupe : {o.groupe.nom}
                        </span>
                      )}
                    </div>
                    <MiniKpis etabs={o.etablissements as Etab[]} />
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: 18 }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  o.etablissements.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <TableHeader />
                      <tbody>
                        {o.etablissements.map(e => <EtabRow key={e.id} e={e as Etab} />)}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ padding: '16px 18px', fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>Aucun établissement rattaché</p>
                  )
                )}
              </Card>
            )
          })}

          {/* Établissements sans organisme */}
          {etabsSansOrganisme.length > 0 && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Sans organisme</span>
                <MiniKpis etabs={etabsSansOrganisme} />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <TableHeader />
                <tbody>{etabsSansOrganisme.map(e => <EtabRow key={e.id} e={e} />)}</tbody>
              </table>
            </Card>
          )}

          {organismes.length === 0 && etabsSansOrganisme.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text3)', padding: 40, fontSize: 13 }}>Aucun organisme créé</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
        Pour modifier un abonnement, rendez-vous sur la page CIFEC Admin.
      </p>
    </div>
  )
}
