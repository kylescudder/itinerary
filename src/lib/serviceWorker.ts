export const registerServiceWorker = () => {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    const reloadKey = 'itinerary:sw-reload'
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.sessionStorage.getItem(reloadKey)) return
      window.sessionStorage.setItem(reloadKey, '1')
      window.location.reload()
    })

    void navigator.serviceWorker.register('/sw.js')
  })
}
