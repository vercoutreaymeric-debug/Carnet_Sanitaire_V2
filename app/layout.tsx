import type { Metadata } from 'next'
import './globals.css'
import ConditionalShell from '@/components/ConditionalShell'

export const metadata: Metadata = {
  title: 'Carnet Sanitaire — CIFEC',
  description: "Carnet sanitaire numérique conforme à l'arrêté du 26 mai 2021",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00aeef" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Carnet Sanitaire" />
        <link rel="apple-touch-icon" href="/assets/logo-cifec.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ConditionalShell>
          {children}
        </ConditionalShell>
      </body>
    </html>
  )
}
