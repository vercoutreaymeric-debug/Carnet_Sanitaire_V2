'use client'
import { usePathname } from 'next/navigation'
import AppShell from './AppShell'
import { LangProvider } from '@/contexts/LangContext'
import { AuthProvider } from '@/contexts/AuthContext'

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const bare = pathname === '/login' || pathname.startsWith('/preview')

  if (bare) return <LangProvider><AuthProvider>{children}</AuthProvider></LangProvider>

  return (
    <LangProvider>
      <AuthProvider>
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </LangProvider>
  )
}
