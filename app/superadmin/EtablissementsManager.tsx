'use client'
import { useState } from 'react'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal'

interface Abonnement {
  plan: string; statut: string; dateExpiration: string | Date
  maxBassins: number; maxUtilisateurs: number; notes: string
  dateDebut: string | Date
}

interface Etablissement {
  id: number; nom: string; adresse: string; telephone: string; createdAt: string | Date
  abonnement: Abonnement | null
  _count: { users: number; bassins: number; releves: number }
}

const STATUT_COLOR: Record<string, string> = {
  actif: '#10b981', essai: '#f59e0b', suspendu: '#f97316', expiré: '#ef4444',
}

const PLANS = ['Starter', 'Pro', 'Intégral', 'Sur-mesure']
const STATUTS = ['essai', 'actif', 'suspendu', 'expiré']

export default function EtablissementsManager({ etablissements: initial }: { etablissements: Etablissement[] }) {
  const [etablissements, setEtablissements] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]   = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Etablissement | null>(null)

  // Formulaire création
  const [form, setForm] = useState({
    nom: '', adresse: '', telephone: '',
    plan: 'Starter', statut: 'essai',
    dateDebut: new Date().toISOString().slice(0, 10),
    dateExpiration: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    maxBassins: '5', maxUtilisateurs: '10', notes: '',
    adminUsername: '', adminPassword: '', adminNom: '',
  })

  // Formulaire édition abonnement
  const [editForm, setEditForm] = useState<Partial<Abonnement & { nom: string }>>({})

  async function refresh() {
    const r = await fetch('/api/superadmin/etablissements')
    if (r.ok) setEtablissements(await r.json())
  }

  async function creer() {
    setLoading(true); setMsg('')
    const r = await fetch('/api/superadmin/etablissements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (r.ok) {
      setMsg('✅ Établissement créé avec succès !')
      setShowForm(false)
      setForm({ nom: '', adresse: '', telephone: '', plan: 'Starter', statut: 'essai',
        dateDebut: new Date().toISOString().slice(0, 10),
        dateExpiration: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        maxBassins: '5', maxUtilisateurs: '10', notes: '', adminUsername: '', adminPassword: '', adminNom: '' })
      await refresh()
    } else {
      const d = await r.json()
      setMsg('❌ ' + (d.error || 'Erreur'))
    }
  }

  async function sauvegarderEdit(id: number) {
    setLoading(true); setMsg('')
    const r = await fetch(`/api/superadmin/etablissements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setLoading(false)
    if (r.ok) { setMsg('✅ Mis à jour'); setEditId(null); await refresh() }
    else { const d = await r.json(); setMsg('❌ ' + d.error) }
  }

  async function supprimer(etab: Etablissement) {
    setLoading(true); setMsg('')
    const r = await fetch(`/api/superadmin/etablissements/${etab.id}`, { method: 'DELETE' })
    setLoading(false); setConfirmDelete(null)
    if (r.ok) {
      setMsg(`✅ "${etab.nom}" supprimé avec succès.`)
      await refresh()
    } else {
      let errMsg = `Erreur ${r.status}`
      try { const d = await r.json(); errMsg = d.error || errMsg } catch {}
      setMsg(`❌ Impossible de supprimer : ${errMsg}`)
    }
  }

  function startEdit(etab: Etablissement) {
    setEditId(etab.id)
    setEditForm({
      nom: etab.nom,
      plan: etab.abonnement?.plan ?? 'Starter',
      statut: etab.abonnement?.statut ?? 'essai',
      dateDebut: etab.abonnement?.dateDebut ? new Date(etab.abonnement.dateDebut).toISOString().slice(0, 10) : '',
      dateExpiration: etab.abonnement?.dateExpiration ? new Date(etab.abonnement.dateExpiration).toISOString().slice(0, 10) : '',
      maxBassins: etab.abonnement?.maxBassins ?? 5,
      maxUtilisateurs: etab.abonnement?.maxUtilisateurs ?? 10,
      notes: etab.abonnement?.notes ?? '',
    })
  }

  const inp = (style?: React.CSSProperties) => ({
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' as const,
    ...style,
  })

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="building" size={16} color="#9333ea" /> Établissements clients
        </h3>
        <button onClick={() => { setShowForm(v => !v); setMsg('') }} style={{
          background: '#9333ea', color: '#fff', border: 'none', borderRadius: 8,
          padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="add" size={14} />
          {showForm ? 'Annuler' : 'Nouvel établissement'}
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: msg.startsWith('✅') ? '#10b98118' : '#ef444418', border: `1px solid ${msg.startsWith('✅') ? '#10b98144' : '#ef444444'}`, fontSize: 13, color: msg.startsWith('✅') ? '#10b981' : '#ef4444' }}>
          {msg}
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: '#9333ea' }}>➕ Nouvel établissement</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Nom établissement *</label><input style={inp()} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Piscine de Bordeaux" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Adresse</label><input style={inp()} value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="1 rue des Sports, 33000..." /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Téléphone</label><input style={inp()} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="05 56 ..." /></div>
          </div>

          <p style={{ fontWeight: 600, fontSize: 13, marginTop: 16, marginBottom: 10, color: 'var(--text2)' }}>Abonnement</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Plan</label>
              <select style={inp()} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                {PLANS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Statut</label>
              <select style={inp()} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                {STATUTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Début</label><input style={inp()} type="date" value={form.dateDebut} onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Expiration</label><input style={inp()} type="date" value={form.dateExpiration} onChange={e => setForm(f => ({ ...f, dateExpiration: e.target.value }))} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Max bassins</label><input style={inp()} type="number" value={form.maxBassins} onChange={e => setForm(f => ({ ...f, maxBassins: e.target.value }))} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Max utilisateurs</label><input style={inp()} type="number" value={form.maxUtilisateurs} onChange={e => setForm(f => ({ ...f, maxUtilisateurs: e.target.value }))} /></div>
          </div>

          <p style={{ fontWeight: 600, fontSize: 13, marginTop: 16, marginBottom: 10, color: 'var(--text2)' }}>Compte admin de l'établissement</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Identifiant *</label><input style={inp()} value={form.adminUsername} onChange={e => setForm(f => ({ ...f, adminUsername: e.target.value }))} placeholder="julien" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Mot de passe *</label><input style={inp()} type="password" value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} placeholder="••••••••" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Nom affiché</label><input style={inp()} value={form.adminNom} onChange={e => setForm(f => ({ ...f, adminNom: e.target.value }))} placeholder="Julien Dupont" /></div>
          </div>

          <button onClick={creer} disabled={loading || !form.nom || !form.adminUsername || !form.adminPassword} style={{
            marginTop: 16, background: '#9333ea', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Création...' : '✅ Créer l\'établissement'}
          </button>
        </div>
      )}

      {/* Liste des établissements */}
      {etablissements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏊</div>
          <p>Aucun établissement. Créez le premier !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {etablissements.map(etab => (
            <div key={etab.id} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Header ligne */}
              <div style={{ background: 'var(--surface2)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: '#9333ea22', borderRadius: 8, padding: '6px 8px' }}>
                    <Icon name="building" size={16} color="#9333ea" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{etab.nom}</p>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>{etab.adresse || 'Adresse non renseignée'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {etab.abonnement && (
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: `${STATUT_COLOR[etab.abonnement.statut] ?? '#6b7280'}22`,
                      color: STATUT_COLOR[etab.abonnement.statut] ?? '#6b7280',
                      border: `1px solid ${STATUT_COLOR[etab.abonnement.statut] ?? '#6b7280'}44`,
                    }}>
                      {etab.abonnement.plan} — {etab.abonnement.statut}
                    </span>
                  )}
                  <button onClick={() => editId === etab.id ? setEditId(null) : startEdit(etab)} style={{
                    background: 'var(--accent)22', color: 'var(--accent)', border: 'none', borderRadius: 6,
                    padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}>✏️ Modifier</button>
                  <button onClick={() => setConfirmDelete(etab)} style={{
                    background: '#ef444422', color: '#ef4444', border: 'none', borderRadius: 6,
                    padding: '5px 10px', cursor: 'pointer', fontSize: 12,
                  }}>🗑️</button>
                </div>
              </div>

              {/* Métriques */}
              <div style={{ padding: '10px 16px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>👤 <strong>{etab._count.users}</strong> utilisateur(s)</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>🏊 <strong>{etab._count.bassins}</strong> bassin(s)</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>📊 <strong>{etab._count.releves}</strong> relevé(s)</span>
                {etab.abonnement && (
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                    📅 expire le <strong>{new Date(etab.abonnement.dateExpiration).toLocaleDateString('fr-FR')}</strong>
                  </span>
                )}
              </div>

              {/* Formulaire édition inline */}
              {editId === etab.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: 16, background: 'var(--surface2)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Nom</label>
                      <input style={inp()} value={editForm.nom ?? ''} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Plan</label>
                      <select style={inp()} value={editForm.plan ?? 'Starter'} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}>
                        {PLANS.map(p => <option key={p}>{p}</option>)}
                      </select></div>
                    <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Statut</label>
                      <select style={inp()} value={editForm.statut ?? 'essai'} onChange={e => setEditForm(f => ({ ...f, statut: e.target.value }))}>
                        {STATUTS.map(s => <option key={s}>{s}</option>)}
                      </select></div>
                    <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Expiration</label>
                      <input style={inp()} type="date" value={String(editForm.dateExpiration ?? '').slice(0, 10)} onChange={e => setEditForm(f => ({ ...f, dateExpiration: e.target.value }))} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Max bassins</label>
                      <input style={inp()} type="number" value={editForm.maxBassins ?? 5} onChange={e => setEditForm(f => ({ ...f, maxBassins: parseInt(e.target.value) }))} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Max utilisateurs</label>
                      <input style={inp()} type="number" value={editForm.maxUtilisateurs ?? 10} onChange={e => setEditForm(f => ({ ...f, maxUtilisateurs: parseInt(e.target.value) }))} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => sauvegarderEdit(etab.id)} disabled={loading} style={{
                      background: '#10b981', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>{loading ? '...' : '💾 Sauvegarder'}</button>
                    <button onClick={() => setEditId(null)} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                      padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--text2)',
                    }}>Annuler</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <ConfirmDeleteModal
          nom={confirmDelete.nom}
          type="Établissement"
          danger={3}
          details={[
            `${confirmDelete._count.bassins} bassin(s) et leurs relevés`,
            `${confirmDelete._count.users} utilisateur(s) rattaché(s)`,
            `${confirmDelete._count.releves} relevé(s) enregistré(s)`,
            'Abonnement, contacts, pièces jointes, audit logs…',
          ]}
          onConfirm={() => supprimer(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Card>
  )
}
