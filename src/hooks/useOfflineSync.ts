import { useEffect } from 'react'

export const useOfflineSync = (onSync: () => void) => {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => {
      onSync()
    }
    window.addEventListener('offline-sync:complete', handler)
    return () => {
      window.removeEventListener('offline-sync:complete', handler)
    }
  }, [onSync])
}
