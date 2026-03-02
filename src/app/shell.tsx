'use client'

import { useEffect } from 'react'

import Header from '../components/Header'
import { AuthProvider } from '../lib/auth'
import { setupOfflineSync } from '../lib/offlineSync'
import { registerServiceWorker } from '../lib/serviceWorker'

export default function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
    return setupOfflineSync()
  }, [])

  return (
    <AuthProvider>
      <div className="app-shell">
        <Header />
        <div className="app-content">{children}</div>
      </div>
    </AuthProvider>
  )
}
