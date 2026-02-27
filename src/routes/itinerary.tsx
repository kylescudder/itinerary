import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createItineraryItem,
  getItineraryItems,
  updateItineraryItem,
} from '../lib/api'
import { useAuth } from '../lib/auth'
import { useTrip } from '../hooks/useTrip'
import { useOfflineSync } from '../hooks/useOfflineSync'
import type { ItineraryItem } from '../lib/types'
import { formatDateLabel, formatTimeLabel, groupItemsByDate } from '../lib/utils'
import { loadGoogleMaps } from '../lib/googleMaps'

export const Route = createFileRoute('/itinerary')({ component: Itinerary })

const itemTypes = ['activity', 'meal', 'travel', 'stay', 'other']

function Itinerary() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const { trip, trips, loading: tripLoading, setActiveTrip } = useTrip()
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [type, setType] = useState(itemTypes[0])
  const isAuthed = !!session?.user

  useEffect(() => {
    if (authLoading) return
    if (!isAuthed) {
      navigate({ to: '/' })
    }
  }, [authLoading, isAuthed, navigate])
  const [startTime, setStartTime] = useState('')
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeSuggestions, setPlaceSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([])
  const [placeLoading, setPlaceLoading] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [placeLat, setPlaceLat] = useState<number | null>(null)
  const [placeLng, setPlaceLng] = useState<number | null>(null)
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesRef = useRef<google.maps.places.PlacesService | null>(null)
  const directionsRef = useRef<google.maps.DirectionsService | null>(null)
  const [travelInfo, setTravelInfo] = useState<
    Record<
      string,
      {
        durationText: string
        distanceMiles: number
        mode: 'walk' | 'transit'
        note?: string
      }
    >
  >({})

  useEffect(() => {
    if (!trip) return
    setItems([])
    setTravelInfo({})
  }, [trip?.id])

  const loadItems = useCallback(async () => {
    if (!trip) return
    setLoading(true)
    setError(null)
    try {
      const data = await getItineraryItems(trip.id)
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load itinerary.')
    } finally {
      setLoading(false)
    }
  }, [trip])

  useEffect(() => {
    if (!trip) return
    loadItems()
  }, [trip, loadItems])

  useOfflineSync(() => {
    if (!trip) return
    loadItems()
  })

  useEffect(() => {
    let mounted = true
    const setupPlaces = async () => {
      try {
        await loadGoogleMaps()
        if (!mounted) return
        if (!autocompleteRef.current) {
          autocompleteRef.current = new google.maps.places.AutocompleteService()
        }
        if (!placesRef.current) {
          const container = document.createElement('div')
          placesRef.current = new google.maps.places.PlacesService(container)
        }
        if (!directionsRef.current) {
          directionsRef.current = new google.maps.DirectionsService()
        }
      } catch (err) {
        if (mounted) {
          setPlaceError(
            err instanceof Error ? err.message : 'Unable to load Google Places.'
          )
        }
      }
    }

    setupPlaces()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!placeQuery || placeQuery.length < 3) {
      setPlaceSuggestions([])
      setPlaceLoading(false)
      return
    }

    let active = true
    setPlaceLoading(true)
    const timer = setTimeout(() => {
      const service = autocompleteRef.current
      if (!service) {
        setPlaceLoading(false)
        return
      }
      service.getPlacePredictions({ input: placeQuery }, (predictions, status) => {
        if (!active) return
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions
        ) {
          setPlaceSuggestions([])
          setPlaceLoading(false)
          return
        }
        setPlaceSuggestions(predictions)
        setPlaceLoading(false)
      })
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [placeQuery])

  useEffect(() => {
    if (!placeQuery) {
      setPlaceId(null)
      setPlaceName(null)
      setPlaceLat(null)
      setPlaceLng(null)
    }
  }, [placeQuery])

  useEffect(() => {
    const service = directionsRef.current
    if (!service) return
    if (items.length < 2) return

    const pairs = [] as Array<{
      origin: ItineraryItem
      destination: ItineraryItem
    }>

    for (let i = 0; i < items.length - 1; i += 1) {
      const origin = items[i]
      const destination = items[i + 1]
      if (
        origin.lat == null ||
        origin.lng == null ||
        destination.lat == null ||
        destination.lng == null
      ) {
        continue
      }
      const key = `${origin.id}:${destination.id}`
      if (travelInfo[key]) continue
      pairs.push({ origin, destination })
    }

    if (!pairs.length) return

    const toMiles = (meters: number) => meters / 1609.344

    const requestRoute = (
      origin: ItineraryItem,
      destination: ItineraryItem,
      travelMode: google.maps.TravelMode,
      departureTime?: Date
    ) =>
      new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        service.route(
          {
            origin: { lat: origin.lat!, lng: origin.lng! },
            destination: { lat: destination.lat!, lng: destination.lng! },
            travelMode,
            transitOptions: departureTime ? { departureTime } : undefined,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result)
            } else {
              reject(new Error(status))
            }
          }
        )
      })

    const run = async () => {
      for (const pair of pairs) {
        const key = `${pair.origin.id}:${pair.destination.id}`
        try {
          const walking = await requestRoute(
            pair.origin,
            pair.destination,
            google.maps.TravelMode.WALKING
          )
          const leg = walking.routes[0]?.legs?.[0]
          const walkingSeconds = leg?.duration?.value ?? 0
          const distanceMeters = leg?.distance?.value ?? 0
          if (walkingSeconds > 1800) {
            try {
              const departureTime = pair.destination.start_time
                ? new Date(pair.destination.start_time)
                : new Date()
              const transit = await requestRoute(
                pair.origin,
                pair.destination,
                google.maps.TravelMode.TRANSIT,
                departureTime
              )
              const transitLeg = transit.routes[0]?.legs?.[0]
              const transitSeconds = transitLeg?.duration?.value ?? walkingSeconds
              const transitMeters = transitLeg?.distance?.value ?? distanceMeters
              setTravelInfo((prev) => ({
                ...prev,
                [key]: {
                  durationText: transitLeg?.duration?.text || `${Math.round(transitSeconds / 60)} min`,
                  distanceMiles: toMiles(transitMeters),
                  mode: 'transit',
                },
              }))
            } catch {
              setTravelInfo((prev) => ({
                ...prev,
                [key]: {
                  durationText: leg?.duration?.text || `${Math.round(walkingSeconds / 60)} min`,
                  distanceMiles: toMiles(distanceMeters),
                  mode: 'walk',
                  note: 'No transit route found',
                },
              }))
            }
          } else {
            setTravelInfo((prev) => ({
              ...prev,
              [key]: {
                durationText: leg?.duration?.text || `${Math.round(walkingSeconds / 60)} min`,
                distanceMiles: toMiles(distanceMeters),
                mode: 'walk',
              },
            }))
          }
        } catch {
          // Ignore route errors
        }
      }
    }

    run()
  }, [items, travelInfo])

  const grouped = useMemo(() => groupItemsByDate(items), [items])

  const handleAdd = async () => {
    if (!trip) return
    if (!title.trim()) {
      setError('Please add a title for the itinerary item.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        trip_id: trip.id,
        type,
        title: title.trim(),
        notes: notes.trim() || null,
        start_time: startTime ? new Date(startTime).toISOString() : null,
        done: false,
        lat: placeLat,
        lng: placeLng,
        place_name: placeName,
        place_id: placeId,
      }
      const created = await createItineraryItem(payload)
      setItems((prev) => [created, ...prev])
      setTitle('')
      setNotes('')
      setStartTime('')
      setPlaceQuery('')
      setPlaceSuggestions([])
      setPlaceId(null)
      setPlaceName(null)
      setPlaceLat(null)
      setPlaceLng(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add item.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDone = async (item: ItineraryItem) => {
    try {
      const updated = await updateItineraryItem(
        item.id,
        { done: !item.done },
        item
      )
      setItems((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update item.')
    }
  }

  const handleSelectPlace = (
    prediction: google.maps.places.AutocompletePrediction
  ) => {
    setPlaceQuery(prediction.description)
    setPlaceSuggestions([])
    setPlaceError(null)
    const mainText = prediction.structured_formatting?.main_text
    if (mainText) {
      setTitle(mainText)
    }

    const placesService = placesRef.current
    if (!placesService) {
      setPlaceName(prediction.description)
      setPlaceId(prediction.place_id)
      return
    }

    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'name', 'formatted_address', 'place_id'],
      },
      (result, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
          setPlaceName(prediction.description)
          setPlaceId(prediction.place_id)
          return
        }
        setPlaceId(result.place_id || prediction.place_id)
        setPlaceName(
          result.name || result.formatted_address || prediction.description
        )
        const location = result.geometry?.location
        if (location) {
          setPlaceLat(location.lat())
          setPlaceLng(location.lng())
        }
      }
    )
  }

  const buildDirectionsUrl = (
    origin: ItineraryItem,
    destination: ItineraryItem,
    mode: 'walk' | 'transit'
  ) => {
    const originValue =
      origin.lat != null && origin.lng != null
        ? `${origin.lat},${origin.lng}`
        : origin.place_name || origin.title
    const destinationValue =
      destination.lat != null && destination.lng != null
        ? `${destination.lat},${destination.lng}`
        : destination.place_name || destination.title

    const isAppleDevice = /iPad|iPhone|iPod|Macintosh/i.test(
      navigator.userAgent
    )

    if (isAppleDevice) {
      const flag = mode === 'transit' ? 'r' : 'w'
      return `https://maps.apple.com/?saddr=${encodeURIComponent(
        originValue
      )}&daddr=${encodeURIComponent(destinationValue)}&dirflg=${flag}`
    }

    const travelMode = mode === 'transit' ? 'transit' : 'walking'
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      originValue
    )}&destination=${encodeURIComponent(
      destinationValue
    )}&travelmode=${travelMode}`
  }

  if (authLoading || tripLoading) {
    return (
      <main className="page-shell">
        <div className="section-shell mx-auto max-w-5xl px-8 py-12">
          <p className="text-sm text-[color:var(--ink-600)]">Loading itinerary...</p>
        </div>
      </main>
    )
  }

  if (!isAuthed) {
    return null
  }

  if (!trip) {
    return (
      <main className="page-shell">
        <div className="section-shell mx-auto max-w-5xl px-8 py-12">
          <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
            Create or join a trip to start planning.
          </h1>
          <button
            type="button"
            onClick={() => navigate({ to: '/trip' })}
            className="focus-ring mt-6 rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
          >
            Go to trip setup
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="section-shell px-8 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
                  {trip.name}
                </p>
                <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
                  Itinerary
                </h1>
              </div>
              {trips.length > 1 ? (
                <label className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
                  Active trip
                  <select
                    value={trip.id}
                    onChange={(event) => setActiveTrip(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-3 py-2 text-sm normal-case tracking-normal text-[color:var(--ink-900)]"
                  >
                    {trips.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--clay-600)]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="section-shell px-8 py-8">
              <p className="text-sm text-[color:var(--ink-600)]">Loading items...</p>
            </div>
          ) : grouped.length ? (
            grouped.map((group) => (
              <div key={group.date} className="section-shell px-8 py-6">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
                  {formatDateLabel(group.date)}
                </p>
                <div className="mt-4 space-y-3">
                  {group.items.map((item, index) => {
                    const next = group.items[index + 1]
                    const key = next ? `${item.id}:${next.id}` : null
                    const info = key ? travelInfo[key] : null
                    const hasCoords =
                      !!next &&
                      item.lat != null &&
                      item.lng != null &&
                      next.lat != null &&
                      next.lng != null

                    return (
                      <div key={item.id} className="space-y-3">
                        <div className="flex items-start justify-between gap-4 rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3">
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                item.done
                                  ? 'text-[color:var(--ink-600)] line-through'
                                  : 'text-[color:var(--ink-900)]'
                              }`}
                            >
                              {item.title}
                            </p>
                            <p className="text-xs text-[color:var(--ink-600)]">
                              {item.start_time
                                ? formatTimeLabel(item.start_time)
                                : 'Anytime'}{' '}
                              · {item.type}
                            </p>
                            {item.notes ? (
                              <p className="mt-2 text-xs text-[color:var(--ink-600)]">
                                {item.notes}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleDone(item)}
                            className="focus-ring rounded-full border border-[color:var(--sand-300)] px-3 py-1.5 text-xs font-semibold text-[color:var(--ink-700)]"
                          >
                            {item.done ? 'Undo' : 'Done'}
                          </button>
                        </div>

                        {next ? (
                          <a
                            href={buildDirectionsUrl(
                              item,
                              next,
                              info?.mode || 'walk'
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-2xl border border-dashed border-[color:var(--sand-300)] px-4 py-3 text-xs text-[color:var(--ink-600)] transition hover:border-[color:var(--sun-400)] hover:text-[color:var(--ink-900)]"
                          >
                            {hasCoords ? (
                              info ? (
                                <span>
                                  Travel {info.distanceMiles.toFixed(1)} mi ·{' '}
                                  {info.durationText} ·{' '}
                                  {info.mode === 'walk'
                                    ? info.note
                                      ? 'Walk (no transit)'
                                      : 'Walk'
                                    : 'Transit'}
                                </span>
                              ) : (
                                <span>Calculating travel time…</span>
                              )
                            ) : (
                              <span>Add locations to see travel time.</span>
                            )}
                          </a>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="section-shell px-8 py-8">
              <p className="text-sm text-[color:var(--ink-600)]">
                No itinerary items yet. Add the first one on the right.
              </p>
            </div>
          )}
        </section>

        <aside className="section-shell h-fit px-8 py-8">
          <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
            Add an item
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-600)]">
            Capture times, notes, and anything your group needs to remember.
          </p>
          <div className="mt-6 space-y-4">
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Place search
              <div className="relative mt-2">
                <input
                  value={placeQuery}
                  onChange={(event) => setPlaceQuery(event.target.value)}
                  className="w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                  placeholder="Search for a place"
                />
                {placeLoading ? (
                  <div className="absolute right-3 top-3 text-xs text-[color:var(--ink-600)]">
                    Searching...
                  </div>
                ) : null}
              </div>
              {placeError ? (
                <p className="mt-2 text-xs text-[color:var(--clay-600)]">
                  {placeError}
                </p>
              ) : null}
              {placeSuggestions.length ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-[color:var(--sand-300)] bg-white shadow">
                  {placeSuggestions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handleSelectPlace(prediction)}
                      className="flex w-full flex-col gap-1 px-4 py-3 text-left text-sm hover:bg-[color:var(--sand-100)]"
                    >
                      <span className="font-semibold text-[color:var(--ink-900)]">
                        {prediction.structured_formatting?.main_text ||
                          prediction.description}
                      </span>
                      <span className="text-xs text-[color:var(--ink-600)]">
                        {prediction.structured_formatting?.secondary_text || ''}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </label>
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                placeholder="Tea ceremony"
              />
            </label>
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Type
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
              >
                {itemTypes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Start time
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 h-28 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                placeholder="Remember to book by Friday."
              />
            </label>
            <button
              type="button"
              onClick={handleAdd}
              disabled={loading}
              className="focus-ring w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
            >
              {loading ? 'Saving...' : 'Add item'}
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}
