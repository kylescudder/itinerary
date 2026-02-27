import { supabase } from './supabase'
import type { ItineraryItem, PlaceSuggestion, Trip } from './types'
import { generateTripCode } from './utils'

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new Error('Please sign in to continue.')
  }
  return data.user.id
}

export async function getTrip(): Promise<Trip | null> {
  const { data, error } = await supabase.from('trip').select('*').limit(1).maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
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
  const { data, error } = await supabase
    .from('itinerary_item')
    .select('*')
    .order('start_time', { ascending: true, nullsFirst: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function createItineraryItem(payload: {
  trip_id: string
  type: ItineraryItem['type']
  title: string
  notes: string | null
  start_time: string | null
  done: boolean
  lat: number | null
  lng: number | null
  place_name?: string | null
  place_id?: string | null
}): Promise<ItineraryItem> {
  const { data, error } = await supabase
    .from('itinerary_item')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateItineraryItem(
  id: string,
  updates: Partial<
    Pick<
      ItineraryItem,
      'done' | 'title' | 'notes' | 'start_time' | 'lat' | 'lng' | 'place_name' | 'place_id'
    >
  >
): Promise<ItineraryItem> {
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

  return data
}

export async function getSuggestions(): Promise<PlaceSuggestion[]> {
  const { data, error } = await supabase
    .from('place_suggestion')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function createSuggestion(payload: {
  trip_id: string
  type: PlaceSuggestion['type']
  title: string
  notes: string | null
  lat: number | null
  lng: number | null
  place_name?: string | null
  place_id?: string | null
}): Promise<PlaceSuggestion> {
  const { data, error } = await supabase
    .from('place_suggestion')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
