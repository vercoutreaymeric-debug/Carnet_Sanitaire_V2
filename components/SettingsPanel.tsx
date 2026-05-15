'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from './Icon'
import { useLang } from '@/contexts/LangContext'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

const labels = {
  fr: {
    title: 'Paramètres',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    language: 'Langue',
    logout: 'Déconnexion',
    version: 'Version',
  },
  en: {
    title: 'Settings',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    logout: 'Log out',
    version: 'Version',
  },
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const [dark, setDark] = useState(false)
  const [rappelHeure, setRappelHeure] = useState('10:00')

  const t = labels[lang]

  useEffect(() => {
    const savedDark = localStorage.getItem('theme') === 'dark'
    const savedHeure = localStorage.getItem('rappelHeure') || '10:00'
    setDark(savedDark)
    setRappelHeure(savedHeure)
    if (savedDark) document.body.classList.add('dark')
    else document.body.classList.remove('dark')
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    if (next) {
      document.body.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  function toggleLang() {
    const next = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  async function handleLogout() {
    if (!confirm(lang === 'fr' ? 'Se déconnecter ?' : 'Log out?')) return
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        bottom: 72,
        left: 12,
        width: 240,
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 201,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
            {t.title}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 2 }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Theme */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>{t.theme}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Light */}
            <button
              onClick={() => { if (dark) toggleTheme() }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '10px 8px', borderRadius: 10,
                border: !dark ? '2px solid var(--accent)' : '2px solid var(--border)',
                background: !dark ? 'var(--accent)11' : 'var(--surface2)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Icon name="sun" size={18} color={!dark ? 'var(--accent)' : 'var(--text3)'} />
              <span style={{ fontSize: 12, fontWeight: !dark ? 600 : 400, color: !dark ? 'var(--accent)' : 'var(--text3)' }}>{t.light}</span>
            </button>
            {/* Dark */}
            <button
              onClick={() => { if (!dark) toggleTheme() }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '10px 8px', borderRadius: 10,
                border: dark ? '2px solid var(--accent)' : '2px solid var(--border)',
                background: dark ? 'var(--accent)11' : 'var(--surface2)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Icon name="moon" size={18} color={dark ? 'var(--accent)' : 'var(--text3)'} />
              <span style={{ fontSize: 12, fontWeight: dark ? 600 : 400, color: dark ? 'var(--accent)' : 'var(--text3)' }}>{t.dark}</span>
            </button>
          </div>
        </div>

        {/* Language */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>{t.language}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['fr', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '9px 8px', borderRadius: 10,
                  border: lang === l ? '2px solid var(--accent)' : '2px solid var(--border)',
                  background: lang === l ? 'var(--accent)11' : 'var(--surface2)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'DM Sans', fontWeight: lang === l ? 600 : 400,
                  fontSize: 13, color: lang === l ? 'var(--accent)' : 'var(--text3)',
                }}
              >
                <Icon name="globe" size={14} color={lang === l ? 'var(--accent)' : 'var(--text3)'} />
                {l === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Rappel */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>
            {lang === 'fr' ? 'Rappel relevé journalier' : 'Daily record reminder'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="calendar" size={15} color="var(--text3)" />
            <input
              type="time"
              value={rappelHeure}
              onChange={e => { setRappelHeure(e.target.value); localStorage.setItem('rappelHeure', e.target.value); localStorage.removeItem('lastRappelDate') }}
              style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none' }}
            />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
            {lang === 'fr' ? 'Notification si aucun relevé saisi avant cette heure' : 'Notification if no record entered before this time'}
          </p>
        </div>

        {/* Logout */}
        <div style={{ padding: '12px 16px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text2)', cursor: 'pointer',
              fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ff444411'; (e.currentTarget as HTMLButtonElement).style.color = '#ff4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; }}
          >
            <Icon name="logout" size={16} />
            {t.logout}
          </button>
        </div>

        {/* Version */}
        <div style={{ padding: '0 16px 12px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', opacity: 0.6 }}>
            {t.version} 2.0 — NOR:SSAP2004757A
          </span>
        </div>
      </div>
    </>
  )
}
