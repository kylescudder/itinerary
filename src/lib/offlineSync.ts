import { flushPendingActions } from './api'

export const setupOfflineSync = () => {
  if (typeof window === 'undefined') return

  const sync = () => {
    void flushPendingActions()
  }

  window.addEventListener('online', sync)
  if (navigator.onLine) {
    sync()
  }

  return () => {
    window.removeEventListener('online', sync)
  }
}
