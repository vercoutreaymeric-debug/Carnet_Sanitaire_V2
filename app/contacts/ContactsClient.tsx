'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Btn from '@/components/Btn'
import Icon from '@/components/Icon'
import HelpPanel from '@/components/HelpPanel'
import { CanManageConfig, CanDelete } from '@/components/RoleGate'
import type { Contact } from '@/types'

interface Props { initialData: Contact[] }

const CATEGORIES = ['Urgences', 'Administration', 'Services', 'Technique']

const emptyForm: Omit<Contact, 'id'> = {
  categorie: 'Services', nom: '', adresse: null, responsable: null, bureau: null, domicile: null,
}

export default function ContactsClient({ initialData }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialData)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Contact>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newForm, setNewForm] = useState<typeof emptyForm>({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const allCategories = CATEGORIES

  const startEdit = (c: Contact) => { setEditingId(c.id); setEditForm({ ...c }) }
  const updEdit = (k: keyof Contact, v: string) => setEditForm(f => ({ ...f, [k]: v || null }))
  const updNew = (k: keyof typeof emptyForm, v: string) => setNewForm(f => ({ ...f, [k]: v || null }))

  const handleSave = async (id: number) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
      const updated: Contact = await res.json()
      setContacts(cs => cs.map(c => c.id === id ? updated : c))
      setEditingId(null)
      router.refresh()
    } finally { setSaving(false) }
  }

  const handleAdd = async () => {
    if (!newForm.nom.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newForm) })
      const c: Contact = await res.json()
      setContacts(cs => [...cs, c])
      setNewForm({ ...emptyForm })
      setShowAdd(false)
      router.refresh()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    setContacts(cs => cs.filter(c => c.id !== id))
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6,
    padding: '5px 8px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none', width: '100%',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Contacts importants</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Numéros de téléphone et adresses utiles</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HelpPanel pageId="contacts" />
          <button onClick={() => window.open('/preview/contacts', '_blank')} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600 }}>
            <Icon name="download" size={16} />PDF
          </button>
          <CanManageConfig>
            <Btn icon="plus" small onClick={() => setShowAdd(v => !v)}>{showAdd ? 'Annuler' : 'Ajouter un contact'}</Btn>
          </CanManageConfig>
        </div>
      </div>

      <CanManageConfig>
      {showAdd && (
        <Card style={{ border: '1px solid var(--accent)44' }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--accent)' }}>Nouveau contact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>Catégorie</label>
              <select style={selectStyle} value={newForm.categorie} onChange={e => updNew('categorie', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {(['nom', 'adresse', 'responsable', 'bureau', 'domicile'] as const).map(field => (
              <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, textTransform: 'capitalize' }}>{field}</label>
                <input style={inputStyle} value={newForm[field] ?? ''} onChange={e => updNew(field, e.target.value)} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Btn small icon="save" onClick={handleAdd} disabled={saving || !newForm.nom.trim()}>Enregistrer</Btn>
            <Btn small variant="ghost" onClick={() => setShowAdd(false)}>Annuler</Btn>
          </div>
        </Card>
      )}
      </CanManageConfig>

      {allCategories.filter(cat => contacts.some(c => c.categorie === cat)).map(cat => (
        <div key={cat}>
          <h3 style={{ fontWeight: 600, fontSize: 13, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{cat}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {contacts.filter(c => c.categorie === cat).map((c, i, arr) => (
              <div key={c.id} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                {editingId === c.id ? (
                  <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {(['nom', 'adresse', 'responsable', 'bureau', 'domicile'] as const).map(field => (
                      <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, textTransform: 'capitalize' }}>{field}</label>
                        <input style={inputStyle} value={(editForm[field] as string) ?? ''} onChange={e => updEdit(field, e.target.value)} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                      <Btn small icon="save" onClick={() => handleSave(c.id)} disabled={saving}>OK</Btn>
                      <Btn small variant="ghost" onClick={() => setEditingId(null)}>✕</Btn>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr auto', gap: 8, padding: '12px 20px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.nom}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{c.adresse || c.responsable || '—'}</span>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 13, color: c.bureau ? 'var(--accent)' : 'var(--text3)' }}>{c.bureau || '—'}</span>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--text3)' }}>{c.domicile || '—'}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <CanManageConfig>
                        <button onClick={() => startEdit(c)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 4 }}><Icon name="edit" size={13} /></button>
                      </CanManageConfig>
                      <CanDelete>
                        <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }}><Icon name="trash" size={13} /></button>
                      </CanDelete>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <p style={{ fontSize: 11, color: 'var(--text3)' }}>
        Centre anti-poisons national — Hôpital Fernand-Widal, 200 r. Fbg Saint-Denis 75010 Paris · 01 40 05 48 48
      </p>
    </div>
  )
}
