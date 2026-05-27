'use client'
import { useState, useEffect, useRef } from 'react'

interface PJ { id: number; nom: string; type: string; taille: number; createdAt: string }

interface Props {
  module: 'releve' | 'intervention' | 'traitement'
  moduleId: number
  canEdit?: boolean
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  return '📎'
}

export default function PiecesJointes({ module, moduleId, canEdit = true }: Props) {
  const [pjs, setPjs] = useState<PJ[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const res = await fetch(`/api/pieces-jointes?module=${module}&moduleId=${moduleId}`)
    if (res.ok) setPjs(await res.json())
  }

  useEffect(() => { load() }, [moduleId])

  const handleUpload = async (file: File) => {
    setError('')
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('module', module)
    fd.append('moduleId', String(moduleId))
    const res = await fetch('/api/pieces-jointes', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erreur upload'); setUploading(false); return }
    setPjs(p => [...p, data])
    setUploading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette pièce jointe ?')) return
    await fetch(`/api/pieces-jointes/${id}`, { method: 'DELETE' })
    setPjs(p => p.filter(x => x.id !== id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        📎 Pièces jointes {pjs.length > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{pjs.length}</span>}
      </p>

      {/* Liste des fichiers */}
      {pjs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {pjs.map(pj => (
            <div key={pj.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px' }}>
              <span style={{ fontSize: 16 }}>{fileIcon(pj.type)}</span>
              <a
                href={`/api/pieces-jointes/${pj.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {pj.nom}
              </a>
              <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{formatSize(pj.taille)}</span>
              {canEdit && (
                <button
                  onClick={() => handleDelete(pj.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 16, padding: '0 2px', lineHeight: 1 }}
                  title="Supprimer"
                >×</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zone de dépôt */}
      {canEdit && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed var(--border)', borderRadius: 8, padding: '10px 14px',
            textAlign: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--text3)',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          {uploading ? '⏳ Envoi en cours…' : '＋ Déposer ou cliquer pour ajouter (JPEG, PNG, PDF — max 5 Mo)'}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }}
          />
        </div>
      )}
      {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>❌ {error}</p>}
    </div>
  )
}
