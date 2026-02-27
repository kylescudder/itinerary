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
  itineraryItems: 'itinerary:itinerary-items',
  suggestions: 'itinerary:suggestions',
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

export const readCachedTrip = () =>
  readJson<Trip | null>(STORAGE_KEYS.trip, null)

export const cacheTrip = (trip: Trip | null) => {
  writeJson(STORAGE_KEYS.trip, trip)
}

export const readCachedItineraryItems = () =>
  readJson<ItineraryItem[]>(STORAGE_KEYS.itineraryItems, [])

export const cacheItineraryItems = (items: ItineraryItem[]) => {
  writeJson(STORAGE_KEYS.itineraryItems, items)
}

export const addCachedItineraryItem = (item: ItineraryItem) => {
  const current = readCachedItineraryItems()
  writeJson(STORAGE_KEYS.itineraryItems, [item, ...current])
}

export const updateCachedItineraryItem = (
  id: string,
  updates: UpdateItineraryItemPayload,
  updatedAt: string
) => {
  const current = readCachedItineraryItems()
  writeJson(
    STORAGE_KEYS.itineraryItems,
    current.map((item) =>
      item.id === id ? { ...item, ...updates, updated_at: updatedAt } : item
    )
  )
}

export const replaceCachedItineraryItem = (
  localId: string,
  item: ItineraryItem
) => {
  const current = readCachedItineraryItems()
  writeJson(
    STORAGE_KEYS.itineraryItems,
    current.map((entry) => (entry.id === localId ? item : entry))
  )
}

export const readCachedSuggestions = () =>
  readJson<PlaceSuggestion[]>(STORAGE_KEYS.suggestions, [])

export const cacheSuggestions = (items: PlaceSuggestion[]) => {
  writeJson(STORAGE_KEYS.suggestions, items)
}

export const addCachedSuggestion = (item: PlaceSuggestion) => {
  const current = readCachedSuggestions()
  writeJson(STORAGE_KEYS.suggestions, [item, ...current])
}

export const replaceCachedSuggestion = (
  localId: string,
  item: PlaceSuggestion
) => {
  const current = readCachedSuggestions()
  writeJson(
    STORAGE_KEYS.suggestions,
    current.map((entry) => (entry.id === localId ? item : entry))
  )
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
