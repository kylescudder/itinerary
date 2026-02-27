import { supabase } from './supabase'
import type {
  CreateItineraryItemPayload,
  CreateSuggestionPayload,
  ItineraryItem,
  PlaceSuggestion,
  Trip,
  UpdateItineraryItemPayload,
} from './types'
import { generateTripCode } from './utils'
import {
  addCachedItineraryItem,
  addCachedSuggestion,
  cacheItineraryItems,
  cacheSuggestions,
  cacheTrip,
  enqueueAction,
  getPendingActions,
  isOffline,
  readCachedItineraryItems,
  readCachedSuggestions,
  readCachedTrip,
  removePendingAction,
  replaceCachedItineraryItem,
  replaceCachedSuggestion,
  savePendingActions,
  updateCachedItineraryItem,
} from './offline'

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new Error('Please sign in to continue.')
  }
  return data.user.id
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

export async function getTrip(): Promise<Trip | null> {
  if (isOffline()) {
    const cached = readCachedTrip()
    if (cached) return cached
  }
  const { data, error } = await supabase.from('trip').select('*').limit(1).maybeSingle()
  if (error) {
    if (isOffline()) {
      return readCachedTrip()
    }
    throw new Error(error.message)
  }
  cacheTrip(data ?? null)
  return data ?? null
}

export async function createTrip(name: string): Promise<Trip> {
  const userId = await requireUserId()
  let created: Trip | null = null
  let lastError: string | null = null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = crypto.randomUUID()
    const code = generateTripCode()
    const { error } = await supabase
      .from('trip')
      .insert({ id, name, code })

    if (error) {
      lastError = error.message
      continue
    }

    const { error: memberError } = await supabase
      .from('trip_members')
      .insert({ trip_id: id, user_id: userId, role: 'owner' })

    if (memberError) {
      lastError = memberError.message
      continue
    }

    const { data: trip, error: fetchError } = await supabase
      .from('trip')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      lastError = fetchError.message
      continue
    }

    if (trip) {
      created = trip
      break
    }
  }

  if (!created) {
    throw new Error(lastError || 'Unable to create trip.')
  }

  return created
}

export async function joinTrip(code: string): Promise<Trip> {
  const userId = await requireUserId()
  const { data: trip, error } = await supabase
    .from('trip')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!trip) {
    throw new Error('Trip not found.')
  }

  const { error: memberError } = await supabase
    .from('trip_members')
    .upsert({ trip_id: trip.id, user_id: userId, role: 'member' }, { onConflict: 'trip_id,user_id' })

  if (memberError) {
    throw new Error(memberError.message)
  }

  return trip
}

export async function updateTripName(id: string, name: string): Promise<Trip> {
  const { data, error } = await supabase
    .from('trip')
    .update({ name })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Trip not found.')
  }

  return data
}

export async function getItineraryItems(): Promise<ItineraryItem[]> {
  if (isOffline()) {
    const cached = readCachedItineraryItems()
    if (cached.length) return cached
  }
  const { data, error } = await supabase
    .from('itinerary_item')
    .select('*')
    .order('start_time', { ascending: true, nullsFirst: false })

  if (error) {
    if (isOffline()) {
      return readCachedItineraryItems()
    }
    throw new Error(error.message)
  }

  const items = data || []
  cacheItineraryItems(items)
  return items
}

export async function createItineraryItem(
  payload: CreateItineraryItemPayload
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
    addCachedItineraryItem(localItem)
    return localItem
  }
  const { data, error } = await supabase
    .from('itinerary_item')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  addCachedItineraryItem(data)
  return data
}

export async function updateItineraryItem(
  id: string,
  updates: UpdateItineraryItemPayload,
  current?: ItineraryItem
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
    updateCachedItineraryItem(id, updates, updatedAt)
    return updated
  }
  const { data, error } = await supabase
    .from('itinerary_item')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Itinerary item not found.')
  }

  updateCachedItineraryItem(id, updates, data.updated_at)
  return data
}

export async function getSuggestions(): Promise<PlaceSuggestion[]> {
  if (isOffline()) {
    const cached = readCachedSuggestions()
    if (cached.length) return cached
  }
  const { data, error } = await supabase
    .from('place_suggestion')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    if (isOffline()) {
      return readCachedSuggestions()
    }
    throw new Error(error.message)
  }

  const items = data || []
  cacheSuggestions(items)
  return items
}

export async function createSuggestion(
  payload: CreateSuggestionPayload
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
    addCachedSuggestion(localItem)
    return localItem
  }
  const { data, error } = await supabase
    .from('place_suggestion')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  addCachedSuggestion(data)
  return data
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
        const { data, error } = await supabase
          .from('itinerary_item')
          .insert(action.payload)
          .select('*')
          .single()
        if (error) throw new Error(error.message)
        replaceCachedItineraryItem(action.localId, data)
      }

      if (action.type === 'updateItineraryItem') {
        const { data, error } = await supabase
          .from('itinerary_item')
          .update(action.payload.updates)
          .eq('id', action.payload.id)
          .select('*')
          .maybeSingle()
        if (error) throw new Error(error.message)
        if (data) {
          updateCachedItineraryItem(
            action.payload.id,
            action.payload.updates,
            data.updated_at
          )
        }
      }

      if (action.type === 'createSuggestion') {
        const { data, error } = await supabase
          .from('place_suggestion')
          .insert(action.payload)
          .select('*')
          .single()
        if (error) throw new Error(error.message)
        replaceCachedSuggestion(action.localId, data)
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
