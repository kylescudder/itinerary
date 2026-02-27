const envSiteUrl = import.meta.env.VITE_SITE_URL || ''

function getFallbackOrigin() {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

export function getAuthRedirectUrl(path = '/login') {
  const baseUrl = envSiteUrl || getFallbackOrigin()
  if (!baseUrl) return ''
  return new URL(path, baseUrl).toString()
}
