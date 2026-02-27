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
  lat: number | null
  lng: number | null
  place_name?: string | null
  place_id?: string | null
  created_at: string
  updated_at: string
}

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
