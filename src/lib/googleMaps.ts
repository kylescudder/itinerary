/// <reference types="@types/google.maps" />
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let loaderPromise: Promise<typeof window.google> | null = null

export async function loadGoogleMaps() {
  if (loaderPromise) {
    return loaderPromise
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY')
  }

  setOptions({ key: apiKey, libraries: ['places', 'routes'] })
  loaderPromise = Promise.all([
    importLibrary('places'),
    importLibrary('routes'),
  ]).then(() => window.google)
  return loaderPromise
}
