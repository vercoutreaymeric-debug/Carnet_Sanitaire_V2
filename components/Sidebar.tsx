'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Icon from './Icon'
import SettingsPanel from './SettingsPanel'
import { useLang } from '@/contexts/LangContext'
import { useAuth } from '@/contexts/AuthContext'
import { T, t } from '@/lib/translations'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles'
import type { Role } from '@/lib/roles'

interface SidebarProps { open: boolean; onClose: () => void; alertCount?: number }

export default function Sidebar({ open, onClose, alertCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { lang } = useLang()
  const { user, canManageUsers, isSuperAdmin } = useAuth()
  const role = user?.role as Role | undefined

  // Visibilité des onglets par rôle
  const allNavItems = [
    { href: '/dashboard',     key: 'dashboard',    icon: 'dashboard' as const, roles: ['superadmin', 'admin', 'responsable_etablissement', 'responsable_saisie', 'visualisateur', 'controleur_ars'] },
    { href: '/releves',       key: 'releves',      icon: 'water' as const,    roles: ['superadmin', 'admin', 'responsable_etablissement', 'responsable_saisie', 'visualisateur', 'controleur_ars'] },
    { href: '/frequentation', key: 'frequentation',icon: 'people' as const,   roles: ['superadmin', 'admin', 'responsable_etablissement', 'responsable_saisie', 'visualisateur'] },
    { href: '/interventions', key: 'interventions', icon: 'wrench' as const,  roles: ['superadmin', 'admin', 'responsable_etablissement', 'responsable_saisie', 'visualisateur'] },
    { href: '/traitements',   key: 'traitements',  icon: 'flask' as const,    roles: ['superadmin', 'admin', 'responsable_etablissement', 'responsable_saisie', 'visualisateur'] },
    { href: '/bassins',       key: 'bassins',      icon: 'pool' as const,     roles: ['superadmin', 'admin', 'responsable_etablissement', 'responsable_saisie', 'visualisateur', 'controleur_ars'] },
    { href: '/contacts',      key: 'contacts',     icon: 'phone' as const,    roles: ['superadmin', 'admin', 'responsable_etablissement', 'responsable_saisie', 'visualisateur'] },
    { href: '/statistiques',  key: 'statistiques', icon: 'chart' as const,    roles: ['superadmin', 'admin', 'responsable_etablissement', 'visualisateur', 'controleur_ars'] },
    { href: '/historique',    key: 'historique',   icon: 'calendar' as const, roles: ['superadmin', 'admin', 'responsable_etablissement', 'controleur_ars'] },
    { href: '/export-pdf',    key: 'export_pdf',   icon: 'download' as const, roles: ['superadmin', 'admin', 'responsable_etablissement', 'controleur_ars'] },
    { href: '/etablissement', key: 'etablissement',icon: 'building' as const,    roles: ['superadmin', 'admin', 'responsable_etablissement'] },
    { href: '/abonnement',    key: 'abonnement',   icon: 'creditCard' as const, roles: ['superadmin', 'admin', 'responsable_etablissement'] },
  ]

  const navItems = allNavItems.filter(item => role ? item.roles.includes(role) : false)

  function navLink(href: string, key: string, icon: typeof allNavItems[0]['icon'], badge?: number) {
    const active = pathname === href || (pathname === '/' && href === '/dashboard')
    const label = t(T.nav[key as keyof typeof T.nav], lang)
    return (
      <Link key={href} href={href} onClick={onClose} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
        background: active ? 'rgba(0,0,0,0.18)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.75)',
        fontWeight: active ? 600 : 400, fontSize: 14, position: 'relative', transition: 'all 0.15s',
      }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,0,0,0.12)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' } }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.75)' } }}
      >
        {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#fff', borderRadius: '0 3px 3px 0' }} />}
        <Icon name={icon} size={16} />
        <span>{label}</span>
        {badge && badge > 0 && (
          <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{badge}</span>
        )}
      </Link>
    )
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <nav className={`sidebar${open ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.08)' }}>
          <Image src="/assets/logo-cifec-transparent.png" alt="CIFEC" width={120} height={44}
            style={{ height: 44, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }} priority />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 8 }}>
            {lang === 'fr' ? 'Carnet sanitaire numérique' : 'Digital sanitary record'}
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => navLink(item.href, item.key, item.icon, item.href === '/releves' ? alertCount : undefined))}

        </div>

        {/* CIFEC Admin — fixe au-dessus de Utilisateurs */}
        {isSuperAdmin && (
          <div style={{ padding: '4px 12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <Link href="/superadmin" onClick={onClose} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
              background: pathname === '/superadmin' ? 'rgba(147,51,234,0.4)' : 'rgba(147,51,234,0.15)',
              color: '#e9d5ff', fontWeight: 500, fontSize: 13,
              border: '1px solid rgba(147,51,234,0.4)',
              transition: 'all 0.15s',
            }}>
              <Icon name="settings" size={15} />
              <span>CIFEC Admin</span>
            </Link>
          </div>
        )}

        {/* Lien Utilisateurs — fixe au-dessus du bas */}
        {canManageUsers && (
          <div style={{ padding: '4px 12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <Link href="/admin/users" onClick={onClose} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
              background: pathname === '/admin/users' ? 'rgba(0,0,0,0.18)' : 'transparent',
              color: pathname === '/admin/users' ? '#fff' : 'rgba(255,255,255,0.75)',
              fontWeight: pathname === '/admin/users' ? 600 : 400, fontSize: 14,
              position: 'relative', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (pathname !== '/admin/users') { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,0,0,0.12)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' } }}
              onMouseLeave={e => { if (pathname !== '/admin/users') { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.75)' } }}
            >
              {pathname === '/admin/users' && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#fff', borderRadius: '0 3px 3px 0' }} />}
              <Icon name="people" size={16} />
              <span>{lang === 'fr' ? 'Utilisateurs' : 'Users'}</span>
            </Link>
          </div>
        )}

        {/* Utilisateur connecté + Paramètres */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {user && role ? (
            <>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: ROLE_COLORS[role],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {(user.nom || user.username).slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.nom || user.username}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
                  {ROLE_LABELS[role][lang]}
                </p>
              </div>
            </>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          {/* Bouton paramètres toujours visible */}
          <button onClick={() => setSettingsOpen(v => !v)} title="Paramètres"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4, flexShrink: 0 }}>
            <Icon name="settings" size={16} />
          </button>
        </div>

        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </nav>
    </>
  )
}
