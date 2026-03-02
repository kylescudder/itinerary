import type { Metadata } from 'next'

import './globals.css'
import AppShell from './shell'

export const metadata: Metadata = {
  title: 'Itinerary',
  description: 'Build one shared plan and keep everyone moving together.',
  themeColor: '#f8edf0',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-body">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
