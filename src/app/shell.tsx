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
      <div className="flex min-h-screen flex-col min-[900px]:flex-row">
        <Header />
        <div className="flex-1 min-[900px]:pl-[260px]">{children}</div>
      </div>
    </AuthProvider>
  )
}
