'use client'
import { usePathname } from 'next/navigation'
import Icon from './Icon'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import { T, t } from '@/lib/translations'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'
import type { Role } from '@/lib/roles'

const pageKeys: Record<string, keyof typeof T.nav> = {
  '/dashboard':     'dashboard',
  '/releves':       'releves',
  '/frequentation': 'frequentation',
  '/interventions': 'interventions',
  '/bassins':       'bassins',
  '/etablissement': 'etablissement',
  '/contacts':      'contacts',
  '/statistiques':  'statistiques',
  '/historique':    'historique',
  '/admin/users':   'settings',
  '/superadmin':    'settings',
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { lang } = useLang()
  const key = pageKeys[pathname]
  const label = key ? t(T.nav[key], lang) : pathname === '/superadmin' ? 'CIFEC Admin' : 'Carnet sanitaire'
  const role = user?.role as Role | undefined

  return (
    <header className="topbar">
      <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex', padding: 4 }} aria-label="Menu">
        <Icon name="menu" size={20} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <span style={{ color: 'var(--text3)', fontSize: 13 }}>Carnet sanitaire</span>
        <span style={{ color: 'var(--text3)' }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
      </div>

      {user && role && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
            background: ROLE_COLORS[role] + '22', color: ROLE_COLORS[role],
          }}>
            {ROLE_LABELS[role][lang]}
          </span>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: ROLE_COLORS[role],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            {(user.nom || user.username).slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  )
}
