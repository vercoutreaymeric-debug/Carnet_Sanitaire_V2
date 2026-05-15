'use client'
import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

interface Props {
  onResult: (bassinId: string) => void
  onClose: () => void
}

export default function QRScanner({ onResult, onClose }: Props) {
  const divId = 'qr-scanner-region'
  const scannerRef = useRef<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let html5QrCode: unknown
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      html5QrCode = new Html5Qrcode(divId)
      scannerRef.current = html5QrCode
      ;(html5QrCode as { start: Function }).start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => {
          try {
            const url = new URL(decodedText)
            const bassinId = url.searchParams.get('bassinId')
            if (bassinId) {
              onResult(bassinId)
            } else {
              setError('QR code non reconnu — utilisez le QR d\'un bassin')
            }
          } catch {
            setError('QR code invalide')
          }
        },
        () => {}
      ).catch((err: unknown) => {
        setError('Impossible d\'accéder à la caméra')
        console.error(err)
      })
    })

    return () => {
      if (scannerRef.current) {
        const s = scannerRef.current as { stop: () => Promise<void>; clear: () => void }
        s.stop().then(() => s.clear()).catch(() => {})
      }
    }
  }, [onResult])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,79,110,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border2)', maxWidth: 380, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>Scanner un bassin</h3>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Pointez la caméra vers le QR code du bassin</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4 }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div id={divId} style={{ borderRadius: 10, overflow: 'hidden', background: '#000', minHeight: 260 }} />
          {error && (
            <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>
          )}
          <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 12 }}>
            Le bassin et l'heure actuelle seront remplis automatiquement
          </p>
        </div>
      </div>
    </div>
  )
}
