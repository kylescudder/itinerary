import { supabase } from './supabase'
import type {
  CreateItineraryItemPayload,
  PlaceCache,
  CreateSuggestionPayload,
  ItineraryItem,
  PlaceSuggestion,
  Trip,
  UpdateItineraryItemPayload,
  UpsertPlaceCachePayload,
} from './types'
import {
  addCachedItineraryItem,
  addCachedSuggestion,
  cacheItineraryItems,
  cacheSuggestions,
  enqueueAction,
  getPendingActions,
  isOffline,
  readActiveTripId,
  readCachedItineraryItems,
  readCachedSuggestions,
  readCachedTripById,
  readCachedTrips,
  removePendingAction,
  removePendingCreateItineraryItem,
  replaceCachedItineraryItem,
  replaceCachedSuggestion,
  removeCachedItineraryItem,
  savePendingActions,
  setActiveTripId,
  updateCachedItineraryItem,
  cacheTrips,
  upsertCachedTrip,
} from './offline'

const apiBaseUrl = '/api'

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) {
    throw new Error('Please sign in to continue.')
  }
  return data.session.access_token
}

async function readApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const expectsJson = contentType.includes('application/json')

  if (!expectsJson) {
    const message = await response.text()
    throw new Error(message || 'Request failed.')
  }

  const payload = (await response.json()) as T & { error?: string }

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.')
  }

  return payload
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken()
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  return readApiJson<T>(response)
}

const createClientId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const isNetworkError = (error: unknown) => {
  if (!error) return false
  const message = error instanceof Error ? error.message : String(error)
  return /fetch|network|offline/i.test(message)
}

export async function getTrips(): Promise<Trip[]> {
  if (isOffline()) {
    const cached = readCachedTrips()
    if (cached.length) return cached
  }
  let trips: Trip[] = []
  try {
    trips = await apiFetch<Trip[]>('/trips')
  } catch (error) {
    if (isOffline()) {
      return readCachedTrips()
    }
    throw error
  }
  cacheTrips(trips)
  return trips
}

export async function getTrip(): Promise<Trip | null> {
  const cachedId = readActiveTripId()
  if (isOffline()) {
    if (cachedId) {
      const cached = readCachedTripById(cachedId)
      if (cached) return cached
    }
    return readCachedTrips()[0] || null
  }

  const trips = await getTrips()
  if (!trips.length) {
    setActiveTripId(null)
    return null
  }

  const selected = cachedId ? trips.find((trip) => trip.id === cachedId) : null
  const active = selected || trips[0]
  setActiveTripId(active.id)
  return active
}

export async function createTrip(
  name: string,
  options?: {
    startDate?: string | null
    endDate?: string | null
    stripeSessionId?: string | null
    stripePaymentIntentId?: string | null
  },
): Promise<Trip> {
  const created = await apiFetch<Trip>('/trips', {
    method: 'POST',
    body: JSON.stringify({
      name,
      start_date: options?.startDate ?? null,
      end_date: options?.endDate ?? null,
      stripe_session_id: options?.stripeSessionId ?? null,
      stripe_payment_intent_id: options?.stripePaymentIntentId ?? null,
    }),
  })
  setActiveTripId(created.id)
  upsertCachedTrip(created)
  return created
}

export async function joinTrip(code: string): Promise<Trip> {
  const trip = await apiFetch<Trip>('/trips/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  setActiveTripId(trip.id)
  upsertCachedTrip(trip)
  return trip
}

export async function updateTripDetails(
  id: string,
  updates: {
    name?: string
    start_date?: string | null
    end_date?: string | null
  },
): Promise<Trip> {
  return apiFetch<Trip>(`/trips/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  })
}

export async function getItineraryItems(
  tripId: string,
): Promise<ItineraryItem[]> {
  if (isOffline()) {
    const cached = readCachedItineraryItems(tripId)
    if (cached.length) return cached
  }
  let items: ItineraryItem[] = []
  try {
    items = await apiFetch<ItineraryItem[]>(`/trips/${tripId}/itinerary-items`)
  } catch (error) {
    if (isOffline()) {
      return readCachedItineraryItems(tripId)
    }
    throw error
  }
  cacheItineraryItems(tripId, items)
  return items
}

export async function createItineraryItem(
  payload: CreateItineraryItemPayload,
): Promise<ItineraryItem> {
  if (isOffline()) {
    const now = new Date().toISOString()
    const localId = `local-${createClientId()}`
    const localItem: ItineraryItem = {
      id: localId,
      created_at: now,
      updated_at: now,
      ...payload,
    }
    enqueueAction({
      id: createClientId(),
      type: 'createItineraryItem',
      payload,
      localId,
      createdAt: now,
    })
    addCachedItineraryItem(payload.trip_id, localItem)
    return localItem
  }
  const created = await apiFetch<ItineraryItem>(
    `/trips/${payload.trip_id}/itinerary-items`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  addCachedItineraryItem(payload.trip_id, created)
  return created
}

export async function updateItineraryItem(
  id: string,
  updates: UpdateItineraryItemPayload,
  current?: ItineraryItem,
): Promise<ItineraryItem> {
  if (isOffline()) {
    if (!current) {
      throw new Error('Unable to update offline without cached data.')
    }
    const updatedAt = new Date().toISOString()
    const updated = { ...current, ...updates, updated_at: updatedAt }
    enqueueAction({
      id: createClientId(),
      type: 'updateItineraryItem',
      payload: { id, updates },
      createdAt: updatedAt,
    })
    updateCachedItineraryItem(current.trip_id, id, updates, updatedAt)
    return updated
  }
  const updated = await apiFetch<ItineraryItem>(`/itinerary-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  })

  updateCachedItineraryItem(updated.trip_id, id, updates, updated.updated_at)
  return updated
}

export async function deleteItineraryItem(
  id: string,
  current?: ItineraryItem,
): Promise<void> {
  if (isOffline()) {
    if (!current) {
      throw new Error('Unable to delete offline without cached data.')
    }
    const isLocal = id.startsWith('local-')
    if (isLocal) {
      removePendingCreateItineraryItem(id)
      removeCachedItineraryItem(current.trip_id, id)
      return
    }
    const createdAt = new Date().toISOString()
    enqueueAction({
      id: createClientId(),
      type: 'deleteItineraryItem',
      payload: { id, tripId: current.trip_id },
      createdAt,
    })
    removeCachedItineraryItem(current.trip_id, id)
    return
  }

  const response = await apiFetch<{ tripId: string | null }>(
    `/itinerary-items/${id}`,
    {
      method: 'DELETE',
    },
  )

  const tripId = response.tripId || current?.trip_id
  if (tripId) {
    removeCachedItineraryItem(tripId, id)
  }
}

export async function getSuggestions(
  tripId: string,
): Promise<PlaceSuggestion[]> {
  if (isOffline()) {
    const cached = readCachedSuggestions(tripId)
    if (cached.length) return cached
  }
  let items: PlaceSuggestion[] = []
  try {
    items = await apiFetch<PlaceSuggestion[]>(`/trips/${tripId}/suggestions`)
  } catch (error) {
    if (isOffline()) {
      return readCachedSuggestions(tripId)
    }
    throw error
  }
  cacheSuggestions(tripId, items)
  return items
}

export async function createSuggestion(
  payload: CreateSuggestionPayload,
): Promise<PlaceSuggestion> {
  if (isOffline()) {
    const now = new Date().toISOString()
    const localId = `local-${createClientId()}`
    const localItem: PlaceSuggestion = {
      id: localId,
      created_at: now,
      ...payload,
    }
    enqueueAction({
      id: createClientId(),
      type: 'createSuggestion',
      payload,
      localId,
      createdAt: now,
    })
    addCachedSuggestion(payload.trip_id, localItem)
    return localItem
  }
  const created = await apiFetch<PlaceSuggestion>(
    `/trips/${payload.trip_id}/suggestions`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  addCachedSuggestion(payload.trip_id, created)
  return created
}

export async function searchPlaceCache(
  tripId: string,
  query: string,
): Promise<PlaceCache[]> {
  if (isOffline()) return []
  return apiFetch<PlaceCache[]>(
    `/trips/${tripId}/place-cache?query=${encodeURIComponent(query)}`,
  )
}

export async function upsertPlaceCache(
  entries: UpsertPlaceCachePayload[],
): Promise<void> {
  if (isOffline()) return
  if (!entries.length) return
  await apiFetch<{ ok: true }>(`/trips/${entries[0].trip_id}/place-cache`, {
    method: 'POST',
    body: JSON.stringify({ entries }),
  })
}

export async function flushPendingActions() {
  if (isOffline()) {
    return { flushed: 0, remaining: getPendingActions().length }
  }
  const pending = getPendingActions()
  if (!pending.length) {
    return { flushed: 0, remaining: 0 }
  }

  const remaining = [] as typeof pending
  let flushed = 0

  for (let i = 0; i < pending.length; i += 1) {
    const action = pending[i]
    try {
      if (action.type === 'createItineraryItem') {
        const created = await apiFetch<ItineraryItem>(
          `/trips/${action.payload.trip_id}/itinerary-items`,
          {
            method: 'POST',
            body: JSON.stringify(action.payload),
          },
        )
        replaceCachedItineraryItem(
          action.payload.trip_id,
          action.localId,
          created,
        )
      }

      if (action.type === 'updateItineraryItem') {
        const updated = await apiFetch<ItineraryItem>(
          `/itinerary-items/${action.payload.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ updates: action.payload.updates }),
          },
        )
        updateCachedItineraryItem(
          updated.trip_id,
          action.payload.id,
          action.payload.updates,
          updated.updated_at,
        )
      }

      if (action.type === 'deleteItineraryItem') {
        await apiFetch<{ tripId: string | null }>(
          `/itinerary-items/${action.payload.id}`,
          {
            method: 'DELETE',
          },
        )
        removeCachedItineraryItem(action.payload.tripId, action.payload.id)
      }

      if (action.type === 'createSuggestion') {
        const created = await apiFetch<PlaceSuggestion>(
          `/trips/${action.payload.trip_id}/suggestions`,
          {
            method: 'POST',
            body: JSON.stringify(action.payload),
          },
        )
        replaceCachedSuggestion(action.payload.trip_id, action.localId, created)
      }

      removePendingAction(action.id)
      flushed += 1
    } catch (err) {
      if (isOffline() || isNetworkError(err)) {
        remaining.push(...pending.slice(i))
        break
      }
      console.warn('Offline sync failed', err)
      removePendingAction(action.id)
    }
  }

  if (remaining.length) {
    savePendingActions(remaining)
  }

  if (flushed > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-sync:complete'))
  }

  return { flushed, remaining: remaining.length }
}
