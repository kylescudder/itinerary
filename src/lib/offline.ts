import type {
  CreateItineraryItemPayload,
  CreateSuggestionPayload,
  ItineraryItem,
  PlaceSuggestion,
  Trip,
  UpdateItineraryItemPayload,
} from './types'

type PendingAction =
  | {
      id: string
      type: 'createItineraryItem'
      payload: CreateItineraryItemPayload
      localId: string
      createdAt: string
    }
  | {
      id: string
      type: 'updateItineraryItem'
      payload: {
        id: string
        updates: UpdateItineraryItemPayload
      }
      createdAt: string
    }
  | {
      id: string
      type: 'createSuggestion'
      payload: CreateSuggestionPayload
      localId: string
      createdAt: string
    }

const STORAGE_KEYS = {
  pending: 'itinerary:pending-actions',
  trip: 'itinerary:trip',
  trips: 'itinerary:trips',
  activeTripId: 'itinerary:active-trip-id',
  itineraryItemsByTrip: 'itinerary:itinerary-items-by-trip',
  suggestionsByTrip: 'itinerary:suggestions-by-trip',
} as const

const isBrowser = () => typeof window !== 'undefined'

const canUseStorage = () => {
  if (!isBrowser()) return false
  try {
    const testKey = '__itinerary_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

const readJson = <T>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const writeJson = <T>(key: string, value: T) => {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage write errors
  }
}

export const isOffline = () => (isBrowser() ? !navigator.onLine : false)

export const readActiveTripId = () =>
  readJson<string | null>(STORAGE_KEYS.activeTripId, null)

export const setActiveTripId = (tripId: string | null) => {
  writeJson(STORAGE_KEYS.activeTripId, tripId)
}

export const readCachedTrips = () => {
  const cached = readJson<Trip[]>(STORAGE_KEYS.trips, [])
  if (cached.length) return cached
  const legacy = readJson<Trip | null>(STORAGE_KEYS.trip, null)
  return legacy ? [legacy] : []
}

export const cacheTrips = (trips: Trip[]) => {
  writeJson(STORAGE_KEYS.trips, trips)
}

export const upsertCachedTrip = (trip: Trip) => {
  const current = readCachedTrips()
  const next = current.some((entry) => entry.id === trip.id)
    ? current.map((entry) => (entry.id === trip.id ? trip : entry))
    : [trip, ...current]
  cacheTrips(next)
}

export const readCachedTripById = (tripId: string) =>
  readCachedTrips().find((trip) => trip.id === tripId) || null

const readItineraryCacheMap = () =>
  readJson<Record<string, ItineraryItem[]>>(
    STORAGE_KEYS.itineraryItemsByTrip,
    {}
  )

const writeItineraryCacheMap = (map: Record<string, ItineraryItem[]>) => {
  writeJson(STORAGE_KEYS.itineraryItemsByTrip, map)
}

export const readCachedItineraryItems = (tripId: string) => {
  const map = readItineraryCacheMap()
  return map[tripId] || []
}

export const cacheItineraryItems = (tripId: string, items: ItineraryItem[]) => {
  const map = readItineraryCacheMap()
  writeItineraryCacheMap({ ...map, [tripId]: items })
}

export const addCachedItineraryItem = (tripId: string, item: ItineraryItem) => {
  const map = readItineraryCacheMap()
  const current = map[tripId] || []
  writeItineraryCacheMap({ ...map, [tripId]: [item, ...current] })
}

export const updateCachedItineraryItem = (
  tripId: string,
  id: string,
  updates: UpdateItineraryItemPayload,
  updatedAt: string
) => {
  const map = readItineraryCacheMap()
  const current = map[tripId] || []
  writeItineraryCacheMap({
    ...map,
    [tripId]: current.map((item) =>
      item.id === id ? { ...item, ...updates, updated_at: updatedAt } : item
    ),
  })
}

export const replaceCachedItineraryItem = (
  tripId: string,
  localId: string,
  item: ItineraryItem
) => {
  const map = readItineraryCacheMap()
  const current = map[tripId] || []
  writeItineraryCacheMap({
    ...map,
    [tripId]: current.map((entry) => (entry.id === localId ? item : entry)),
  })
}

const readSuggestionCacheMap = () =>
  readJson<Record<string, PlaceSuggestion[]>>(
    STORAGE_KEYS.suggestionsByTrip,
    {}
  )

const writeSuggestionCacheMap = (map: Record<string, PlaceSuggestion[]>) => {
  writeJson(STORAGE_KEYS.suggestionsByTrip, map)
}

export const readCachedSuggestions = (tripId: string) => {
  const map = readSuggestionCacheMap()
  return map[tripId] || []
}

export const cacheSuggestions = (tripId: string, items: PlaceSuggestion[]) => {
  const map = readSuggestionCacheMap()
  writeSuggestionCacheMap({ ...map, [tripId]: items })
}

export const addCachedSuggestion = (tripId: string, item: PlaceSuggestion) => {
  const map = readSuggestionCacheMap()
  const current = map[tripId] || []
  writeSuggestionCacheMap({ ...map, [tripId]: [item, ...current] })
}

export const replaceCachedSuggestion = (
  tripId: string,
  localId: string,
  item: PlaceSuggestion
) => {
  const map = readSuggestionCacheMap()
  const current = map[tripId] || []
  writeSuggestionCacheMap({
    ...map,
    [tripId]: current.map((entry) => (entry.id === localId ? item : entry)),
  })
}

export const getPendingActions = () =>
  readJson<PendingAction[]>(STORAGE_KEYS.pending, [])

export const savePendingActions = (actions: PendingAction[]) => {
  writeJson(STORAGE_KEYS.pending, actions)
}

export const enqueueAction = (action: PendingAction) => {
  const current = getPendingActions()
  savePendingActions([...current, action])
}

export const removePendingAction = (id: string) => {
  const current = getPendingActions()
  savePendingActions(current.filter((action) => action.id !== id))
}

export type { PendingAction }
