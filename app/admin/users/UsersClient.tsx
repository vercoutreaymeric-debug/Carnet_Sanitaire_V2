'use client'
import { useState, useEffect } from 'react'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'
import type { Role } from '@/lib/roles'

interface User { id: number; username: string; role: string; nom: string; email: string; createdAt: string }

const roleColors: Record<string, string> = ROLE_COLORS as Record<string, string>
const roleLabels: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_LABELS).map(([k, v]) => [k, v.fr])
)

// Rôles créables selon son propre rôle
const CREATABLE_ROLES: Record<string, { value: string; label: string }[]> = {
  superadmin: [
    { value: 'admin', label: 'Admin' },
    { value: 'responsable_etablissement', label: "Responsable d'Établissement" },
    { value: 'responsable_saisie', label: 'Responsable de Saisie' },
    { value: 'visualisateur', label: 'Auditeur' },
    { value: 'controleur_ars', label: 'Contrôleur ARS' },
  ],
  admin: [
    { value: 'responsable_etablissement', label: "Responsable d'Établissement" },
    { value: 'responsable_saisie', label: 'Responsable de Saisie' },
    { value: 'visualisateur', label: 'Auditeur' },
    { value: 'controleur_ars', label: 'Contrôleur ARS' },
  ],
  responsable_etablissement: [
    { value: 'responsable_saisie', label: 'Responsable de Saisie' },
    { value: 'visualisateur', label: 'Auditeur' },
  ],
}

const emptyForm = { username: '', password: '', nom: '', email: '', role: 'responsable_saisie' }

export default function UsersClient() {
  const { user: me } = useAuth()
  const { lang } = useLang()
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ nom: '', email: '', role: 'responsable_saisie', password: '' })

  async function load() {
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ ...emptyForm }); setShowForm(false); load() }
    else { const d = await res.json(); setError(d.error || 'Erreur') }
    setSaving(false)
  }

  async function handleDelete(id: number, username: string) {
    if (!confirm(`Supprimer l'utilisateur "${username}" ?`)) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) load()
    else { const d = await res.json(); alert(d.error) }
  }

  async function handleEdit(id: number) {
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

      {/* Rôles expliqués */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {[
          { role: 'admin',                     desc: lang === 'fr' ? 'Accès complet + gestion utilisateurs + sauvegarde' : 'Full access + user management + backup' },
          { role: 'responsable_etablissement', desc: lang === 'fr' ? 'Modifier, supprimer (hors relevés), gérer utilisateurs' : 'Edit, delete (excl. records), manage users' },
          { role: 'responsable_saisie',        desc: lang === 'fr' ? 'Saisir et modifier les données' : 'Create and edit data' },
          { role: 'visualisateur',             desc: lang === 'fr' ? 'Consultation + statistiques uniquement' : 'Read-only + statistics' },
          { role: 'controleur_ars',            desc: lang === 'fr' ? 'Accès lecture ARS — voit uniquement les relevés validés' : 'ARS read-only — validated records only' },
        ].map(r => (
          <div key={r.role} style={{ background: 'var(--surface2)', border: `1px solid ${roleColors[r.role]}44`, borderRadius: 10, padding: '12px 14px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: roleColors[r.role], display: 'block', marginBottom: 4 }}>
              {roleLabels[r.role]}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{r.desc}</span>
          </div>
        ))}
      </div>

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
            {users.map(u => (
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
                    <input style={{ ...inputStyle, padding: '4px 8px' }} type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="Nouveau mdp (laisser vide = inchangé)" />
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
                        <button onClick={() => { setEditId(u.id); setEditForm({ nom: u.nom, email: u.email || '', role: u.role, password: '' }) }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 4 }} title="Modifier">
                          <Icon name="edit" size={15} />
                        </button>
                        {u.username !== me?.username && (
                          <button onClick={() => handleDelete(u.id, u.username)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }} title="Supprimer">
                            <Icon name="trash" size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
