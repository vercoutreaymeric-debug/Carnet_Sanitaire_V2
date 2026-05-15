'use client'
import { useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import Icon from './Icon'

interface Props {
  title: string
  subtitle?: string
  url: string
  onClose: () => void
  embedded?: boolean  // si true : pas d'overlay, juste le QR code
}

export default function QRModal({ title, subtitle, url, onClose, embedded }: Props) {
  const svgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleDownload = () => {
    const svg = svgRef.current?.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const size = 400
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const a = document.createElement('a')
      a.download = `qr-${title.replace(/\s+/g, '-').toLowerCase()}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const content = (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {!embedded && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4 }}>
            <Icon name="close" size={20} />
          </button>
        </div>
      )}

      {embedded && subtitle && (
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4, alignSelf: 'flex-start' }}>{subtitle}</p>
      )}

      <div ref={svgRef} style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
        <QRCode value={url} size={180} />
      </div>

      <p style={{ fontSize: 11, color: 'var(--text3)', wordBreak: 'break-all', lineHeight: 1.5, textAlign: 'center' }}>{url}</p>

      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <button onClick={handleDownload} style={{ flex: 1, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="download" size={14} />
          Télécharger
        </button>
        <button onClick={() => window.print()} style={{ flex: 1, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="print" size={14} />
          Imprimer
        </button>
      </div>
    </div>
  )

  if (embedded) return content

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(14,79,110,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border2)', maxWidth: 380, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {content}
      </div>
    </div>
  )
}
