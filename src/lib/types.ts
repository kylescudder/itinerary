export type Trip = {
  id: string
  name: string
  code: string
  created_at: string
}

export type ItineraryItem = {
  id: string
  trip_id: string
  type: string
  title: string
  notes: string | null
  start_time: string | null
  done: boolean
  travel_mode?: 'walk' | 'car' | 'transit' | null
  from_place_name?: string | null
  from_place_id?: string | null
  from_lat?: number | null
  from_lng?: number | null
  to_place_name?: string | null
  to_place_id?: string | null
  to_lat?: number | null
  to_lng?: number | null
  from_done?: boolean | null
  to_done?: boolean | null
  lat: number | null
  lng: number | null
  place_name?: string | null
  place_id?: string | null
  created_at: string
  updated_at: string
}

export type CreateItineraryItemPayload = {
  trip_id: string
  type: ItineraryItem['type']
  title: string
  notes: string | null
  start_time: string | null
  done: boolean
  travel_mode?: ItineraryItem['travel_mode']
  from_place_name?: ItineraryItem['from_place_name']
  from_place_id?: ItineraryItem['from_place_id']
  from_lat?: ItineraryItem['from_lat']
  from_lng?: ItineraryItem['from_lng']
  to_place_name?: ItineraryItem['to_place_name']
  to_place_id?: ItineraryItem['to_place_id']
  to_lat?: ItineraryItem['to_lat']
  to_lng?: ItineraryItem['to_lng']
  from_done?: ItineraryItem['from_done']
  to_done?: ItineraryItem['to_done']
  lat: number | null
  lng: number | null
  place_name?: string | null
  place_id?: string | null
}

export type UpdateItineraryItemPayload = Partial<
  Pick<
    ItineraryItem,
    | 'done'
    | 'title'
    | 'notes'
    | 'start_time'
    | 'lat'
    | 'lng'
    | 'place_name'
    | 'place_id'
    | 'travel_mode'
    | 'from_place_name'
    | 'from_place_id'
    | 'from_lat'
    | 'from_lng'
    | 'to_place_name'
    | 'to_place_id'
    | 'to_lat'
    | 'to_lng'
    | 'from_done'
    | 'to_done'
  >
>

export type PlaceSuggestion = {
  id: string
  trip_id: string
  type: string
  title: string
  notes: string | null
  lat: number | null
  lng: number | null
  place_name?: string | null
  place_id?: string | null
  created_at: string
}

export type PlaceCache = {
  id: string
  trip_id: string
  place_id: string
  description: string
  primary_text: string | null
  secondary_text: string | null
  created_at: string
  updated_at: string
}

export type CreateSuggestionPayload = {
  trip_id: string
  type: PlaceSuggestion['type']
  title: string
  notes: string | null
  lat: number | null
  lng: number | null
  place_name?: string | null
  place_id?: string | null
}

export type UpsertPlaceCachePayload = {
  trip_id: string
  place_id: string
  description: string
  primary_text: string | null
  secondary_text: string | null
  updated_at: string
}
