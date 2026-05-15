'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import OfflineBanner from './OfflineBanner'
import RappelManager from './RappelManager'

interface AppShellProps {
  children: React.ReactNode
  alertCount?: number
}

export default function AppShell({ children, alertCount = 0 }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <OfflineBanner />
      <RappelManager />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} alertCount={alertCount} />
      <div className="main-wrapper">
        <Topbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
