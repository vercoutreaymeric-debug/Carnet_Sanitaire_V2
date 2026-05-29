'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'
import type { Role } from '@/lib/roles'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'

interface User { id: number; username: string; role: string; nom: string; email: string; createdAt: string }

const roleColors: Record<string, string> = ROLE_COLORS as Record<string, string>
const roleLabels: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_LABELS).map(([k, v]) => [k, v.fr])
)

// Rôles créables selon son propre rôle
const CREATABLE_ROLES: Record<string, { value: string; label: string }[]> = {
  superadmin: [
    { value: 'responsable_groupe',        label: 'Responsable de Groupe' },
    { value: 'responsable_organisme',     label: "Responsable d'Organisme" },
    { value: 'responsable_etablissement', label: "Responsable d'Établissement" },
    { value: 'responsable_saisie',        label: 'Responsable de Saisie' },
    { value: 'visualisateur',             label: 'Auditeur' },
    { value: 'controleur_ars',            label: 'Contrôleur ARS' },
  ],
  responsable_groupe: [
    { value: 'responsable_organisme',     label: "Responsable d'Organisme" },
    { value: 'responsable_etablissement', label: "Responsable d'Établissement" },
    { value: 'responsable_saisie',        label: 'Responsable de Saisie' },
    { value: 'visualisateur',             label: 'Auditeur' },
    { value: 'controleur_ars',            label: 'Contrôleur ARS' },
  ],
  responsable_organisme: [
    { value: 'responsable_etablissement', label: "Responsable d'Établissement" },
    { value: 'responsable_saisie',        label: 'Responsable de Saisie' },
    { value: 'visualisateur',             label: 'Auditeur' },
    { value: 'controleur_ars',            label: 'Contrôleur ARS' },
  ],
  responsable_etablissement: [
    { value: 'responsable_saisie',        label: 'Responsable de Saisie' },
    { value: 'visualisateur',             label: 'Auditeur' },
  ],
}

const emptyForm = { username: '', password: '', confirmPassword: '', nom: '', email: '', role: 'responsable_saisie' }

const ROLE_ORDER = ['superadmin', 'responsable_groupe', 'responsable_organisme', 'responsable_etablissement', 'responsable_saisie', 'visualisateur', 'controleur_ars']

export default function UsersClient() {
  const { user: me } = useAuth()
  const { lang } = useLang()
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ nom: '', email: '', role: 'responsable_saisie', password: '', confirmPassword: '' })
  const [filterRole, setFilterRole] = useState<string>('')
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null)

  async function load() {
    const res = await fetch('/api/users')
    if (res.ok) {
      const data = await res.json()
      // Trier par ordre de rôle
      data.sort((a: User, b: User) => {
        const ia = ROLE_ORDER.indexOf(a.role)
        const ib = ROLE_ORDER.indexOf(b.role)
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
      })
      setUsers(data)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ ...emptyForm }); setShowForm(false); load() }
    else { const d = await res.json(); setError(d.error || 'Erreur') }
    setSaving(false)
  }

  async function handleDelete(user: User) {
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    setConfirmDeleteUser(null)
    if (res.ok) load()
    else { const d = await res.json(); setError(d.error || 'Erreur lors de la suppression') }
  }

  async function handleEdit(id: number) {
    if (editForm.password && editForm.password !== editForm.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    setSaving(true); setError('')
    const res = await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    if (res.ok) { setEditId(null); load() }
    else { const d = await res.json(); setError(d.error || 'Erreur') }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8,
    padding: '9px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {lang === 'fr' ? 'Gestion des utilisateurs' : 'User management'}
          </h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>
            {lang === 'fr' ? 'Admin · Technicien · Lecteur' : 'Admin · Technician · Viewer'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          <Icon name="plus" size={16} /> {lang === 'fr' ? 'Nouvel utilisateur' : 'New user'}
        </button>
      </div>

      {/* Description des rôles — résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {[
          { role: 'responsable_organisme',     desc: lang === 'fr' ? 'Gère tous les établissements de son organisme' : 'Manages all establishments of their organisation' },
          { role: 'responsable_etablissement', desc: lang === 'fr' ? 'Modifier, supprimer (hors relevés), gérer utilisateurs' : 'Edit, delete (excl. records), manage users' },
          { role: 'responsable_saisie',        desc: lang === 'fr' ? 'Saisir et modifier les données' : 'Create and edit data' },
          { role: 'visualisateur',             desc: lang === 'fr' ? 'Consultation + statistiques uniquement' : 'Read-only + statistics' },
          { role: 'controleur_ars',            desc: lang === 'fr' ? 'Accès lecture ARS — relevés validés uniquement' : 'ARS read-only — validated records only' },
        ].map(r => (
          <div key={r.role} style={{ background: 'var(--surface2)', border: `1px solid ${roleColors[r.role]}44`, borderRadius: 10, padding: '12px 14px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: roleColors[r.role], display: 'block', marginBottom: 4 }}>
              {roleLabels[r.role]}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{r.desc}</span>
          </div>
        ))}
      </div>

      {/* Compteurs par rôle — cliquer pour filtrer */}
      {(() => {
        const rolesPresents = ROLE_ORDER.filter(r => users.some(u => u.role === r))
        if (rolesPresents.length === 0) return null
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              onClick={() => setFilterRole('')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: filterRole === '' ? '2px solid var(--accent)' : '1.5px solid var(--border2)',
                background: filterRole === '' ? 'var(--accent)18' : 'var(--surface2)',
                color: filterRole === '' ? 'var(--accent)' : 'var(--text2)',
              }}
            >
              Tous
              <span style={{ background: 'var(--accent)22', color: 'var(--accent)', borderRadius: 99, padding: '0px 7px', fontSize: 11, fontWeight: 700 }}>
                {users.length}
              </span>
            </button>
            {rolesPresents.map(r => {
              const count = users.filter(u => u.role === r).length
              const c = roleColors[r] ?? '#6b7280'
              const active = filterRole === r
              return (
                <button
                  key={r}
                  onClick={() => setFilterRole(active ? '' : r)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: active ? `2px solid ${c}` : `1.5px solid ${c}44`,
                    background: active ? `${c}18` : 'var(--surface2)',
                    color: active ? c : 'var(--text2)',
                  }}
                >
                  {roleLabels[r] ?? r}
                  <span style={{ background: `${c}22`, color: c, borderRadius: 99, padding: '0px 7px', fontSize: 11, fontWeight: 700 }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* Formulaire création */}
      {showForm && (
        <Card style={{ border: '1px solid var(--accent)44' }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--accent)' }}>
            {lang === 'fr' ? 'Nouvel utilisateur' : 'New user'}
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Identifiant *</label>
                <input style={inputStyle} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required placeholder="jdupont" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Nom complet</label>
                <input style={inputStyle} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Jean Dupont" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean.dupont@example.com" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Mot de passe *</label>
                <input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="••••••••" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Confirmation mot de passe *</label>
                <input style={{ ...inputStyle, borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#dc2626' : undefined }} type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required placeholder="••••••••" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Rôle *</label>
                <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {(CREATABLE_ROLES[me?.role ?? ''] ?? []).map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                {saving ? '…' : lang === 'fr' ? 'Créer' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 14px', fontFamily: 'DM Sans', fontSize: 14, cursor: 'pointer' }}>
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Liste utilisateurs */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{lang === 'fr' ? 'Utilisateur' : 'User'}</th>
              <th>Rôle</th>
              <th>{lang === 'fr' ? 'Nom complet' : 'Full name'}</th>
              <th>Email</th>
              <th>{lang === 'fr' ? 'Mot de passe' : 'Password'}</th>
              <th>{lang === 'fr' ? 'Créé le' : 'Created'}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => !filterRole || u.role === filterRole).map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600, fontFamily: 'DM Mono', fontSize: 13 }}>
                  {u.username}
                  {u.username === me?.username && (
                    <span style={{ marginLeft: 8, fontSize: 10, background: 'var(--accent)22', color: 'var(--accent)', borderRadius: 4, padding: '1px 6px' }}>moi</span>
                  )}
                </td>
                <td>
                  {editId === u.id ? (
                    <select style={{ ...inputStyle, padding: '4px 8px', width: 'auto' }} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                      {(CREATABLE_ROLES[me?.role ?? ''] ?? []).map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, background: roleColors[u.role] + '22', color: roleColors[u.role], borderRadius: 6, padding: '3px 10px' }}>
                      {roleLabels[u.role] ?? u.role}
                    </span>
                  )}
                </td>
                <td>
                  {editId === u.id ? (
                    <input style={{ ...inputStyle, padding: '4px 8px' }} value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom complet" />
                  ) : (
                    <span style={{ color: 'var(--text2)', fontSize: 13 }}>{u.nom || '—'}</span>
                  )}
                </td>
                <td>
                  {editId === u.id ? (
                    <input style={{ ...inputStyle, padding: '4px 8px' }} type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemple.com" />
                  ) : (
                    <span style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email || '—'}</span>
                  )}
                </td>
                <td>
                  {editId === u.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input style={{ ...inputStyle, padding: '4px 8px' }} type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="Nouveau mdp (laisser vide = inchangé)" />
                      <input style={{ ...inputStyle, padding: '4px 8px', borderColor: editForm.confirmPassword && editForm.confirmPassword !== editForm.password ? '#dc2626' : undefined }} type="password" value={editForm.confirmPassword} onChange={e => setEditForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Confirmation mdp" />
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text3)', fontSize: 12 }}>••••••••</span>
                  )}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {editId === u.id ? (
                      <>
                        <button onClick={() => handleEdit(u.id)} disabled={saving} style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans' }}>
                          {lang === 'fr' ? 'Sauvegarder' : 'Save'}
                        </button>
                        <button onClick={() => setEditId(null)} style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans' }}>
                          {lang === 'fr' ? 'Annuler' : 'Cancel'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditId(u.id); setEditForm({ nom: u.nom, email: u.email || '', role: u.role, password: '', confirmPassword: '' }) }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 4 }} title="Modifier">
                          <Icon name="edit" size={15} />
                        </button>
                        {u.username !== me?.username && (
                          <button onClick={() => setConfirmDeleteUser(u)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }} title="Supprimer">
                            <Icon name="trash" size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.filter(u => !filterRole || u.role === filterRole).length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
                  {filterRole ? `Aucun utilisateur avec le rôle "${roleLabels[filterRole] ?? filterRole}"` : 'Aucun utilisateur'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Modal confirmation suppression utilisateur */}
      {confirmDeleteUser && (
        <ConfirmDeleteModal
          nom={confirmDeleteUser.nom || confirmDeleteUser.username}
          type="Utilisateur"
          danger={me?.role === 'superadmin' ? 2 : 1}
          details={[
            `Identifiant : ${confirmDeleteUser.username}`,
            `Rôle : ${roleLabels[confirmDeleteUser.role] ?? confirmDeleteUser.role}`,
            'Toutes ses données de session seront perdues',
          ]}
          onConfirm={() => handleDelete(confirmDeleteUser)}
          onCancel={() => setConfirmDeleteUser(null)}
        />
      )}
    </div>
  )
}
