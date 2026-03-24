'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import {
  createItineraryItem,
  deleteItineraryItem,
  getItineraryItems,
  searchPlaceCache,
  upsertPlaceCache,
  updateItineraryItem,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useTrip } from '../../hooks/useTrip'
import { useOfflineSync } from '../../hooks/useOfflineSync'
import type { ItineraryItem } from '../../lib/types'
import {
  formatDateLabel,
  formatTripDateRange,
  formatTimeLabel,
  groupItemsByDate,
} from '../../lib/utils'
import { loadGoogleMaps } from '../../lib/googleMaps'
import { Bed, Compass, MapPin, Utensils, Zap } from 'lucide-react'

const itemTypes = ['activity', 'meal', 'travel', 'stay', 'other']
const travelModes = ['walk', 'car', 'transit'] as const

type PlaceOption = {
  source: 'google' | 'cache'
  place_id: string
  description: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

export default function ItineraryPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const { trip, trips, loading: tripLoading, setActiveTrip } = useTrip()
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pullStartY = useRef<number | null>(null)
  const isPulling = useRef(false)
  const savedScrollY = useRef(0)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [type, setType] = useState(itemTypes[0])
  const isAuthed = !!session?.user
  const hasLifetimeAccess = !!session?.user?.user_metadata?.lifetime_access

  useEffect(() => {
    if (authLoading) return
    if (!isAuthed) {
      router.replace('/')
    }
  }, [authLoading, isAuthed, router])

  useEffect(() => {
    if (authLoading || tripLoading) return
    if (!isAuthed || !trip) return
    if (hasLifetimeAccess) return
    if (trip.user_role !== 'owner') return
    if (!trip.stripe_session_id) {
      router.replace('/billing/checkout')
    }
  }, [authLoading, tripLoading, isAuthed, trip, hasLifetimeAccess, router])
  const [startTime, setStartTime] = useState('')
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceOption[]>([])
  const [placeLoading, setPlaceLoading] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [placeLat, setPlaceLat] = useState<number | null>(null)
  const [placeLng, setPlaceLng] = useState<number | null>(null)
  const [travelMode, setTravelMode] = useState<(typeof travelModes)[number]>(
    travelModes[0],
  )
  const [travelFromQuery, setTravelFromQuery] = useState('')
  const [travelFromSuggestions, setTravelFromSuggestions] = useState<
    PlaceOption[]
  >([])
  const [travelFromLoading, setTravelFromLoading] = useState(false)
  const [travelFromPlaceId, setTravelFromPlaceId] = useState<string | null>(
    null,
  )
  const [travelFromPlaceName, setTravelFromPlaceName] = useState<string | null>(
    null,
  )
  const [travelFromLat, setTravelFromLat] = useState<number | null>(null)
  const [travelFromLng, setTravelFromLng] = useState<number | null>(null)
  const [travelToQuery, setTravelToQuery] = useState('')
  const [travelToSuggestions, setTravelToSuggestions] = useState<PlaceOption[]>(
    [],
  )
  const [travelToLoading, setTravelToLoading] = useState(false)
  const [travelToPlaceId, setTravelToPlaceId] = useState<string | null>(null)
  const [travelToPlaceName, setTravelToPlaceName] = useState<string | null>(
    null,
  )
  const [travelToLat, setTravelToLat] = useState<number | null>(null)
  const [travelToLng, setTravelToLng] = useState<number | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(
    null,
  )
  const placesRef = useRef<google.maps.places.PlacesService | null>(null)
  const directionsRef = useRef<google.maps.DirectionsService | null>(null)
  const [directionsReady, setDirectionsReady] = useState(false)
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
  const [manualTravelInfo, setManualTravelInfo] = useState<
    Record<
      string,
      {
        durationText: string
        distanceMiles: number
        mode: 'walk' | 'car' | 'transit'
        note?: string
      }
    >
  >({})
  const tripDateRange = useMemo(
    () => formatTripDateRange(trip?.start_date, trip?.end_date),
    [trip?.start_date, trip?.end_date],
  )

  useEffect(() => {
    if (!trip) return
    setItems([])
    setTravelInfo({})
    setManualTravelInfo({})
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

  const refreshItems = useCallback(async () => {
    if (!trip) return
    setIsRefreshing(true)
    try {
      await loadItems()
    } finally {
      setIsRefreshing(false)
    }
  }, [trip, loadItems])

  useEffect(() => {
    if (!trip) return
    loadItems()
  }, [trip, loadItems])

  useOfflineSync(() => {
    refreshItems()
  })

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent) => {
      if (isRefreshing || typeof window === 'undefined') return
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      if (scrollTop > 0) return
      const start = event.touches[0]?.clientY
      if (start == null) return
      pullStartY.current = start
      isPulling.current = true
    },
    [isRefreshing],
  )

  const handleTouchMove = useCallback((event: ReactTouchEvent) => {
    if (!isPulling.current || pullStartY.current == null) return
    const current = event.touches[0]?.clientY
    if (current == null) return
    const delta = current - pullStartY.current
    if (delta <= 0) {
      setPullDistance(0)
      return
    }
    setPullDistance(Math.min(delta, 110))
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    isPulling.current = false
    pullStartY.current = null
    if (pullDistance > 70) {
      setPullDistance(60)
      await refreshItems()
    }
    setPullDistance(0)
  }, [pullDistance, refreshItems])

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
          setDirectionsReady(true)
        }
      } catch (err) {
        if (mounted) {
          setPlaceError(
            err instanceof Error
              ? err.message
              : 'Unable to load Google Places.',
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
      const run = async () => {
        if (!trip) {
          setPlaceLoading(false)
          return
        }

        try {
          const cached = await searchPlaceCache(trip.id, placeQuery)
          if (!active) return
          if (cached.length) {
            setPlaceSuggestions(
              cached.map((entry) => ({
                source: 'cache' as const,
                place_id: entry.place_id,
                description: entry.description,
                structured_formatting: {
                  main_text: entry.primary_text || entry.description,
                  secondary_text: entry.secondary_text || '',
                },
              })),
            )
            setPlaceLoading(false)
            return
          }
        } catch {
          // Ignore cache lookup errors
        }

        const service = autocompleteRef.current
        if (!service) {
          setPlaceLoading(false)
          return
        }
        service.getPlacePredictions(
          { input: placeQuery },
          (predictions, status) => {
            if (!active) return
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !predictions
            ) {
              setPlaceSuggestions([])
              setPlaceLoading(false)
              return
            }
            const options = predictions.map((prediction) => ({
              source: 'google' as const,
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: {
                main_text: prediction.structured_formatting?.main_text,
                secondary_text:
                  prediction.structured_formatting?.secondary_text,
              },
            }))
            setPlaceSuggestions(options)
            setPlaceLoading(false)
            if (trip) {
              const now = new Date().toISOString()
              const entries = options.map((option) => ({
                trip_id: trip.id,
                place_id: option.place_id,
                description: option.description,
                primary_text: option.structured_formatting?.main_text || null,
                secondary_text:
                  option.structured_formatting?.secondary_text || null,
                updated_at: now,
              }))
              upsertPlaceCache(entries).catch(() => {
                // Ignore cache write errors
              })
            }
          },
        )
      }

      run()
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [placeQuery, trip])

  useEffect(() => {
    if (!travelFromQuery || travelFromQuery.length < 3) {
      setTravelFromSuggestions([])
      setTravelFromLoading(false)
      return
    }

    let active = true
    setTravelFromLoading(true)
    const timer = setTimeout(() => {
      const run = async () => {
        if (!trip) {
          setTravelFromLoading(false)
          return
        }

        try {
          const cached = await searchPlaceCache(trip.id, travelFromQuery)
          if (!active) return
          if (cached.length) {
            setTravelFromSuggestions(
              cached.map((entry) => ({
                source: 'cache' as const,
                place_id: entry.place_id,
                description: entry.description,
                structured_formatting: {
                  main_text: entry.primary_text || entry.description,
                  secondary_text: entry.secondary_text || '',
                },
              })),
            )
            setTravelFromLoading(false)
            return
          }
        } catch {
          // Ignore cache lookup errors
        }

        const service = autocompleteRef.current
        if (!service) {
          setTravelFromLoading(false)
          return
        }
        service.getPlacePredictions(
          { input: travelFromQuery },
          (predictions, status) => {
            if (!active) return
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !predictions
            ) {
              setTravelFromSuggestions([])
              setTravelFromLoading(false)
              return
            }
            const options = predictions.map((prediction) => ({
              source: 'google' as const,
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: {
                main_text: prediction.structured_formatting?.main_text,
                secondary_text:
                  prediction.structured_formatting?.secondary_text,
              },
            }))
            setTravelFromSuggestions(options)
            setTravelFromLoading(false)
            if (trip) {
              const now = new Date().toISOString()
              const entries = options.map((option) => ({
                trip_id: trip.id,
                place_id: option.place_id,
                description: option.description,
                primary_text: option.structured_formatting?.main_text || null,
                secondary_text:
                  option.structured_formatting?.secondary_text || null,
                updated_at: now,
              }))
              upsertPlaceCache(entries).catch(() => {
                // Ignore cache write errors
              })
            }
          },
        )
      }

      run()
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [travelFromQuery, trip])

  useEffect(() => {
    if (!travelToQuery || travelToQuery.length < 3) {
      setTravelToSuggestions([])
      setTravelToLoading(false)
      return
    }

    let active = true
    setTravelToLoading(true)
    const timer = setTimeout(() => {
      const run = async () => {
        if (!trip) {
          setTravelToLoading(false)
          return
        }

        try {
          const cached = await searchPlaceCache(trip.id, travelToQuery)
          if (!active) return
          if (cached.length) {
            setTravelToSuggestions(
              cached.map((entry) => ({
                source: 'cache' as const,
                place_id: entry.place_id,
                description: entry.description,
                structured_formatting: {
                  main_text: entry.primary_text || entry.description,
                  secondary_text: entry.secondary_text || '',
                },
              })),
            )
            setTravelToLoading(false)
            return
          }
        } catch {
          // Ignore cache lookup errors
        }

        const service = autocompleteRef.current
        if (!service) {
          setTravelToLoading(false)
          return
        }
        service.getPlacePredictions(
          { input: travelToQuery },
          (predictions, status) => {
            if (!active) return
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !predictions
            ) {
              setTravelToSuggestions([])
              setTravelToLoading(false)
              return
            }
            const options = predictions.map((prediction) => ({
              source: 'google' as const,
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: {
                main_text: prediction.structured_formatting?.main_text,
                secondary_text:
                  prediction.structured_formatting?.secondary_text,
              },
            }))
            setTravelToSuggestions(options)
            setTravelToLoading(false)
            if (trip) {
              const now = new Date().toISOString()
              const entries = options.map((option) => ({
                trip_id: trip.id,
                place_id: option.place_id,
                description: option.description,
                primary_text: option.structured_formatting?.main_text || null,
                secondary_text:
                  option.structured_formatting?.secondary_text || null,
                updated_at: now,
              }))
              upsertPlaceCache(entries).catch(() => {
                // Ignore cache write errors
              })
            }
          },
        )
      }

      run()
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [travelToQuery, trip])

  useEffect(() => {
    if (!placeQuery) {
      setPlaceId(null)
      setPlaceName(null)
      setPlaceLat(null)
      setPlaceLng(null)
    }
  }, [placeQuery])

  useEffect(() => {
    if (!isFormOpen || typeof window === 'undefined') return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFormOpen(false)
        setEditingItem(null)
        requestAnimationFrame(() => {
          window.scrollTo(0, savedScrollY.current)
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFormOpen])

  useEffect(() => {
    if (!travelFromQuery) {
      setTravelFromPlaceId(null)
      setTravelFromPlaceName(null)
      setTravelFromLat(null)
      setTravelFromLng(null)
    }
  }, [travelFromQuery])

  useEffect(() => {
    if (!travelToQuery) {
      setTravelToPlaceId(null)
      setTravelToPlaceName(null)
      setTravelToLat(null)
      setTravelToLng(null)
    }
  }, [travelToQuery])

  useEffect(() => {
    const service = directionsRef.current
    if (!service) return
    if (items.length < 2) return

    const pairs = [] as Array<{
      key: string
      origin: { lat: number; lng: number }
      destination: { lat: number; lng: number }
      departureTime?: Date
    }>

    for (let i = 0; i < items.length - 1; i += 1) {
      const origin = items[i]
      const destination = items[i + 1]
      if (!destination) continue

      if (origin.type === 'travel' && destination.type !== 'travel') {
        if (
          origin.to_lat == null ||
          origin.to_lng == null ||
          destination.lat == null ||
          destination.lng == null
        ) {
          continue
        }
        if (
          origin.to_lat === destination.lat &&
          origin.to_lng === destination.lng
        ) {
          continue
        }
        const key = `travel:${origin.id}:${destination.id}`
        if (travelInfo[key]) continue
        pairs.push({
          key,
          origin: { lat: origin.to_lat, lng: origin.to_lng },
          destination: { lat: destination.lat, lng: destination.lng },
          departureTime: destination.start_time
            ? new Date(destination.start_time)
            : undefined,
        })
        continue
      }

      if (origin.type === 'travel' || destination.type === 'travel') {
        continue
      }
      if (
        origin.lat == null ||
        origin.lng == null ||
        destination.lat == null ||
        destination.lng == null
      ) {
        continue
      }
      if (origin.lat === destination.lat && origin.lng === destination.lng) {
        continue
      }
      const key = `${origin.id}:${destination.id}`
      if (travelInfo[key]) continue
      pairs.push({
        key,
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        departureTime: destination.start_time
          ? new Date(destination.start_time)
          : undefined,
      })
    }

    if (!pairs.length) return

    const toMiles = (meters: number) => meters / 1609.344

    const requestRoute = (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number },
      travelMode: google.maps.TravelMode,
      departureTime?: Date,
    ) =>
      new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        service.route(
          {
            origin,
            destination,
            travelMode,
            transitOptions: departureTime ? { departureTime } : undefined,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result)
            } else {
              reject(new Error(status))
            }
          },
        )
      })

    const run = async () => {
      for (const pair of pairs) {
        const key = pair.key
        try {
          const walking = await requestRoute(
            pair.origin,
            pair.destination,
            google.maps.TravelMode.WALKING,
          )
          const leg = walking.routes[0]?.legs?.[0]
          const walkingSeconds = leg?.duration?.value ?? 0
          const distanceMeters = leg?.distance?.value ?? 0
          if (walkingSeconds > 1800) {
            try {
              const transit = await requestRoute(
                pair.origin,
                pair.destination,
                google.maps.TravelMode.TRANSIT,
                pair.departureTime || new Date(),
              )
              const transitLeg = transit.routes[0]?.legs?.[0]
              const transitSeconds =
                transitLeg?.duration?.value ?? walkingSeconds
              const transitMeters =
                transitLeg?.distance?.value ?? distanceMeters
              setTravelInfo((prev) => ({
                ...prev,
                [key]: {
                  durationText:
                    transitLeg?.duration?.text ||
                    `${Math.round(transitSeconds / 60)} min`,
                  distanceMiles: toMiles(transitMeters),
                  mode: 'transit',
                },
              }))
            } catch {
              setTravelInfo((prev) => ({
                ...prev,
                [key]: {
                  durationText:
                    leg?.duration?.text ||
                    `${Math.round(walkingSeconds / 60)} min`,
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
                durationText:
                  leg?.duration?.text ||
                  `${Math.round(walkingSeconds / 60)} min`,
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
  }, [items, travelInfo, directionsReady])

  useEffect(() => {
    const service = directionsRef.current
    if (!service) return

    const travelItems = items.filter(
      (item) =>
        item.type === 'travel' &&
        item.from_lat != null &&
        item.from_lng != null &&
        item.to_lat != null &&
        item.to_lng != null,
    )

    if (!travelItems.length) return

    const toMiles = (meters: number) => meters / 1609.344

    const requestRoute = (
      item: ItineraryItem,
      travelMode: google.maps.TravelMode,
      departureTime?: Date,
    ) =>
      new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        service.route(
          {
            origin: { lat: item.from_lat!, lng: item.from_lng! },
            destination: { lat: item.to_lat!, lng: item.to_lng! },
            travelMode,
            transitOptions: departureTime ? { departureTime } : undefined,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result)
            } else {
              reject(new Error(status))
            }
          },
        )
      })

    const run = async () => {
      for (const item of travelItems) {
        if (
          manualTravelInfo[item.id] &&
          manualTravelInfo[item.id].mode === (item.travel_mode || 'walk')
        )
          continue
        const mode = item.travel_mode || 'walk'
        const travelMode =
          mode === 'car'
            ? google.maps.TravelMode.DRIVING
            : mode === 'transit'
              ? google.maps.TravelMode.TRANSIT
              : google.maps.TravelMode.WALKING
        try {
          const departureTime = item.start_time
            ? new Date(item.start_time)
            : new Date()
          const result = await requestRoute(
            item,
            travelMode,
            mode === 'transit' ? departureTime : undefined,
          )
          const leg = result.routes[0]?.legs?.[0]
          const durationSeconds = leg?.duration?.value ?? 0
          const distanceMeters = leg?.distance?.value ?? 0
          setManualTravelInfo((prev) => ({
            ...prev,
            [item.id]: {
              durationText:
                leg?.duration?.text ||
                `${Math.round(durationSeconds / 60)} min`,
              distanceMiles: toMiles(distanceMeters),
              mode,
            },
          }))
        } catch {
          // Ignore route errors
        }
      }
    }

    run()
  }, [items, manualTravelInfo, directionsReady])

  const grouped = useMemo(() => groupItemsByDate(items), [items])

  const isItemFullyDone = (item: ItineraryItem) =>
    item.type === 'travel' ? !!item.from_done && !!item.to_done : !!item.done

  const isGroupComplete = (group: { items: ItineraryItem[] }) =>
    group.items.length > 0 && group.items.every(isItemFullyDone)

  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set())
  const prevCompleteRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const nowComplete = new Set(
      grouped.filter(isGroupComplete).map((g) => g.date),
    )
    const newlyComplete = [...nowComplete].filter(
      (d) => !prevCompleteRef.current.has(d),
    )
    if (newlyComplete.length > 0) {
      setCollapsedDates((prev) => {
        const next = new Set(prev)
        for (const d of newlyComplete) next.add(d)
        return next
      })
    }
    prevCompleteRef.current = nowComplete
  }, [grouped])

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }

  const sortItems = (next: ItineraryItem[]) =>
    [...next].sort((a, b) => {
      if (!a.start_time && !b.start_time) return 0
      if (!a.start_time) return 1
      if (!b.start_time) return -1
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })

  const toLocalDateTimeInput = (value: string | null) => {
    if (!value) return ''
    return value.slice(0, 16)
  }

  const resetPlaceFields = () => {
    setPlaceQuery('')
    setPlaceSuggestions([])
    setPlaceId(null)
    setPlaceName(null)
    setPlaceLat(null)
    setPlaceLng(null)
  }

  const resetTravelFields = () => {
    setTravelMode(travelModes[0])
    setTravelFromQuery('')
    setTravelFromSuggestions([])
    setTravelFromPlaceId(null)
    setTravelFromPlaceName(null)
    setTravelFromLat(null)
    setTravelFromLng(null)
    setTravelToQuery('')
    setTravelToSuggestions([])
    setTravelToPlaceId(null)
    setTravelToPlaceName(null)
    setTravelToLat(null)
    setTravelToLng(null)
  }

  const resetForm = () => {
    setType(itemTypes[0])
    setTitle('')
    setNotes('')
    setStartTime('')
    resetPlaceFields()
    resetTravelFields()
  }

  const openAddForm = (initialType?: string) => {
    savedScrollY.current = window.scrollY
    setEditingItem(null)
    setError(null)
    resetForm()
    if (initialType && itemTypes.includes(initialType)) setType(initialType)
    setIsFormOpen(true)
  }

  const openEditForm = (item: ItineraryItem) => {
    savedScrollY.current = window.scrollY
    setEditingItem(item)
    setError(null)
    setType(item.type)
    setTitle(item.title)
    setNotes(item.notes || '')
    setStartTime(toLocalDateTimeInput(item.start_time))
    if (item.type === 'travel') {
      resetPlaceFields()
      setTravelMode(item.travel_mode || travelModes[0])
      setTravelFromQuery(item.from_place_name || '')
      setTravelFromSuggestions([])
      setTravelFromPlaceId(item.from_place_id || null)
      setTravelFromPlaceName(item.from_place_name || null)
      setTravelFromLat(item.from_lat ?? null)
      setTravelFromLng(item.from_lng ?? null)
      setTravelToQuery(item.to_place_name || '')
      setTravelToSuggestions([])
      setTravelToPlaceId(item.to_place_id || null)
      setTravelToPlaceName(item.to_place_name || null)
      setTravelToLat(item.to_lat ?? null)
      setTravelToLng(item.to_lng ?? null)
    } else {
      resetTravelFields()
      setPlaceQuery(item.place_name || '')
      setPlaceSuggestions([])
      setPlaceId(item.place_id || null)
      setPlaceName(item.place_name || null)
      setPlaceLat(item.lat ?? null)
      setPlaceLng(item.lng ?? null)
    }
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingItem(null)
    requestAnimationFrame(() => {
      window.scrollTo(0, savedScrollY.current)
    })
  }

  const handleAdd = async () => {
    if (!trip) return
    if (!title.trim()) {
      setError('Please add a title for the itinerary item.')
      return
    }
    const isTravel = type === 'travel'
    const fromLabel = travelFromPlaceName || travelFromQuery.trim() || null
    const toLabel = travelToPlaceName || travelToQuery.trim() || null
    if (isTravel && (!fromLabel || !toLabel)) {
      setError('Please add both a from and to location for travel.')
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
        start_time: startTime ? startTime + ':00.000Z' : null,
        done: false,
        travel_mode: isTravel ? travelMode : null,
        from_place_name: isTravel ? fromLabel : null,
        from_place_id: isTravel ? travelFromPlaceId : null,
        from_lat: isTravel ? travelFromLat : null,
        from_lng: isTravel ? travelFromLng : null,
        to_place_name: isTravel ? toLabel : null,
        to_place_id: isTravel ? travelToPlaceId : null,
        to_lat: isTravel ? travelToLat : null,
        to_lng: isTravel ? travelToLng : null,
        from_done: isTravel ? false : null,
        to_done: isTravel ? false : null,
        lat: isTravel ? null : placeLat,
        lng: isTravel ? null : placeLng,
        place_name: isTravel ? null : placeName,
        place_id: isTravel ? null : placeId,
      }
      const created = await createItineraryItem(payload)
      setItems((prev) => sortItems([...prev, created]))
      setTitle('')
      setNotes('')
      setStartTime('')
      if (isTravel) {
        resetTravelFields()
      } else {
        resetPlaceFields()
      }
      closeForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add item.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!trip || !editingItem) return
    if (!title.trim()) {
      setError('Please add a title for the itinerary item.')
      return
    }
    const isTravel = type === 'travel'
    const fromLabel = travelFromPlaceName || travelFromQuery.trim() || null
    const toLabel = travelToPlaceName || travelToQuery.trim() || null
    if (isTravel && (!fromLabel || !toLabel)) {
      setError('Please add both a from and to location for travel.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const updates = {
        title: title.trim(),
        notes: notes.trim() || null,
        start_time: startTime ? startTime + ':00.000Z' : null,
        travel_mode: isTravel ? travelMode : null,
        from_place_name: isTravel ? fromLabel : null,
        from_place_id: isTravel ? travelFromPlaceId : null,
        from_lat: isTravel ? travelFromLat : null,
        from_lng: isTravel ? travelFromLng : null,
        to_place_name: isTravel ? toLabel : null,
        to_place_id: isTravel ? travelToPlaceId : null,
        to_lat: isTravel ? travelToLat : null,
        to_lng: isTravel ? travelToLng : null,
        lat: isTravel ? null : placeLat,
        lng: isTravel ? null : placeLng,
        place_name: isTravel ? null : placeName,
        place_id: isTravel ? null : placeId,
        from_done: isTravel ? editingItem.from_done : null,
        to_done: isTravel ? editingItem.to_done : null,
      }
      const updated = await updateItineraryItem(
        editingItem.id,
        updates,
        editingItem,
      )
      setItems((prev) =>
        sortItems(
          prev.map((entry) => (entry.id === updated.id ? updated : entry)),
        ),
      )
      closeForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update item.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (item: ItineraryItem) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Delete this itinerary item? This cannot be undone.',
      )
      if (!confirmed) return
    }
    try {
      await deleteItineraryItem(item.id, item)
      setItems((prev) => prev.filter((entry) => entry.id !== item.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete item.')
    }
  }

  const handleToggleDone = async (item: ItineraryItem) => {
    try {
      const updated = await updateItineraryItem(
        item.id,
        { done: !item.done },
        item,
      )
      setItems((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update item.')
    }
  }

  const handleSelectPlace = (prediction: PlaceOption) => {
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
          result.name || result.formatted_address || prediction.description,
        )
        const location = result.geometry?.location
        if (location) {
          setPlaceLat(location.lat())
          setPlaceLng(location.lng())
        }
      },
    )
  }

  const handleSelectTravelPlace = (
    direction: 'from' | 'to',
    prediction: PlaceOption,
  ) => {
    const description = prediction.description
    if (direction === 'from') {
      setTravelFromQuery(description)
      setTravelFromSuggestions([])
    } else {
      setTravelToQuery(description)
      setTravelToSuggestions([])
    }
    setPlaceError(null)

    const mainText = prediction.structured_formatting?.main_text
    const fallbackName = mainText || description

    const applySelection = (
      name: string,
      placeId: string,
      lat?: number | null,
      lng?: number | null,
    ) => {
      if (direction === 'from') {
        setTravelFromPlaceName(name)
        setTravelFromPlaceId(placeId)
        if (lat != null && lng != null) {
          setTravelFromLat(lat)
          setTravelFromLng(lng)
        }
      } else {
        setTravelToPlaceName(name)
        setTravelToPlaceId(placeId)
        if (lat != null && lng != null) {
          setTravelToLat(lat)
          setTravelToLng(lng)
        }
      }

      if (!title.trim()) {
        const nextFrom =
          direction === 'from' ? name : travelFromPlaceName || travelFromQuery
        const nextTo =
          direction === 'to' ? name : travelToPlaceName || travelToQuery
        if (nextFrom && nextTo) {
          setTitle(`${nextFrom} to ${nextTo}`)
        }
      }
    }

    const placesService = placesRef.current
    if (!placesService) {
      applySelection(fallbackName, prediction.place_id)
      return
    }

    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'name', 'formatted_address', 'place_id'],
      },
      (result, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
          applySelection(fallbackName, prediction.place_id)
          return
        }
        const name = result.name || result.formatted_address || fallbackName
        const location = result.geometry?.location
        applySelection(
          name,
          result.place_id || prediction.place_id,
          location?.lat(),
          location?.lng(),
        )
      },
    )
  }

  const handleToggleTravelDone = async (
    item: ItineraryItem,
    field: 'from_done' | 'to_done',
  ) => {
    try {
      const updated = await updateItineraryItem(
        item.id,
        { [field]: !item[field] },
        item,
      )
      setItems((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update item.')
    }
  }

  const buildTravelDirectionsUrl = (item: ItineraryItem) => {
    const originValue =
      item.from_lat != null && item.from_lng != null
        ? `${item.from_lat},${item.from_lng}`
        : item.from_place_name || item.title
    const destinationValue =
      item.to_lat != null && item.to_lng != null
        ? `${item.to_lat},${item.to_lng}`
        : item.to_place_name || item.title
    const mode = item.travel_mode || 'walk'

    const travelMode =
      mode === 'transit' ? 'transit' : mode === 'car' ? 'driving' : 'walking'
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      originValue,
    )}&destination=${encodeURIComponent(
      destinationValue,
    )}&travelmode=${travelMode}`
  }

  const buildDirectionsUrlFromPoints = (
    originValue: string,
    destinationValue: string,
    mode: 'walk' | 'transit',
  ) => {
    const travelMode = mode === 'transit' ? 'transit' : 'walking'
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      originValue,
    )}&destination=${encodeURIComponent(
      destinationValue,
    )}&travelmode=${travelMode}`
  }

  const buildDirectionsUrl = (
    origin: ItineraryItem,
    destination: ItineraryItem,
    mode: 'walk' | 'transit',
  ) => {
    const originValue =
      origin.lat != null && origin.lng != null
        ? `${origin.lat},${origin.lng}`
        : origin.place_name || origin.title
    const destinationValue =
      destination.lat != null && destination.lng != null
        ? `${destination.lat},${destination.lng}`
        : destination.place_name || destination.title

    return buildDirectionsUrlFromPoints(originValue, destinationValue, mode)
  }

  const isEditMode = !!editingItem
  const addForm = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-600)]">
          Type
        </p>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {(
            [
              {
                key: 'activity',
                label: 'Activity',
                Icon: Zap,
                cols: 'col-span-3',
              },
              {
                key: 'meal',
                label: 'Meal',
                Icon: Utensils,
                cols: 'col-span-3',
              },
              { key: 'stay', label: 'Stay', Icon: Bed, cols: 'col-span-3' },
              {
                key: 'travel',
                label: 'Travel',
                Icon: MapPin,
                cols: 'col-span-3',
              },
              {
                key: 'other',
                label: 'Other',
                Icon: Compass,
                cols: 'col-span-6',
              },
            ] as const
          ).map(({ key, label, Icon, cols }) => (
            <button
              key={key}
              type="button"
              onClick={() => !isEditMode && setType(key)}
              disabled={isEditMode}
              className={`${cols} flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-60 ${
                type === key
                  ? 'border-[color:var(--sun-500)] bg-[color:var(--sun-400)] text-[color:var(--ink-900)]'
                  : 'border-[color:var(--sand-300)] bg-white text-[color:var(--ink-700)] hover:border-[color:var(--sun-400)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {type === 'travel' ? (
        <>
          <label className="text-sm font-semibold text-[color:var(--ink-700)]">
            From
            <div className="relative mt-2">
              <input
                value={travelFromQuery}
                onChange={(event) => setTravelFromQuery(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                placeholder="Search starting point"
              />
              {travelFromLoading ? (
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
            {travelFromSuggestions.length ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-[color:var(--sand-300)] bg-white shadow">
                {travelFromSuggestions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    onClick={() => handleSelectTravelPlace('from', prediction)}
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
            To
            <div className="relative mt-2">
              <input
                value={travelToQuery}
                onChange={(event) => setTravelToQuery(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                placeholder="Search destination"
              />
              {travelToLoading ? (
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
            {travelToSuggestions.length ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-[color:var(--sand-300)] bg-white shadow">
                {travelToSuggestions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    onClick={() => handleSelectTravelPlace('to', prediction)}
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
            Travel mode
            <select
              value={travelMode}
              onChange={(event) =>
                setTravelMode(
                  event.target.value as (typeof travelModes)[number],
                )
              }
              className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
            >
              {travelModes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
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
      )}
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
        Start time
        <div className="mt-2 flex gap-2">
          <input
            type="date"
            value={startTime ? startTime.substring(0, 10) : ''}
            onChange={(event) => {
              const time = startTime.length > 10 ? startTime.substring(11) : ''
              setStartTime(event.target.value + (time ? 'T' + time : ''))
            }}
            className="min-w-0 flex-1 rounded-2xl border border-[color:var(--sand-300)] bg-white px-3 py-3 text-sm"
          />
          <input
            type="time"
            value={startTime.length > 10 ? startTime.substring(11) : ''}
            onChange={(event) => {
              const date = startTime.substring(0, 10)
              setStartTime((date || '') + 'T' + event.target.value)
            }}
            className="min-w-0 w-32 rounded-2xl border border-[color:var(--sand-300)] bg-white px-3 py-3 text-sm"
          />
        </div>
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
        onClick={isEditMode ? handleUpdate : handleAdd}
        disabled={loading}
        className="w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
      >
        {loading ? 'Saving...' : isEditMode ? 'Save changes' : 'Add item'}
      </button>
    </div>
  )

  if (authLoading || tripLoading) {
    return (
      <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
        <div className="mx-auto max-w-5xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-[color:var(--ink-600)]">
            Loading itinerary...
          </p>
        </div>
      </main>
    )
  }

  if (!isAuthed) {
    return null
  }

  if (!trip) {
    return (
      <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
        <div className="mx-auto max-w-5xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
          <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
            Create or join a trip to start planning.
          </h1>
          <button
            type="button"
            onClick={() => router.push('/trip')}
            className="mt-6 rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
          >
            Go to trip setup
          </button>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center text-[10px] uppercase tracking-[0.3em] text-[color:var(--ink-600)] transition"
        style={{
          height: pullDistance ? Math.min(pullDistance, 60) : 0,
          opacity: pullDistance || isRefreshing ? 1 : 0,
        }}
      >
        {isRefreshing
          ? 'Refreshing itinerary...'
          : pullDistance > 70
            ? 'Release to refresh'
            : 'Pull to refresh'}
      </div>
      <div className="mx-auto grid max-w-4xl gap-6 min-[900px]:grid-cols-[1fr_220px]">
        <section className="space-y-6">
          <div className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-8 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
                  {trip.name}
                </p>
                <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
                  Itinerary
                </h1>
                {tripDateRange ? (
                  <p className="mt-2 text-sm text-[color:var(--ink-600)]">
                    {tripDateRange}
                  </p>
                ) : null}
              </div>
              <div className="flex items-end gap-3">
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
          </div>

          {error ? (
            <div className="rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--clay-600)]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-8 shadow-[var(--shadow-soft)]">
              <p className="text-sm text-[color:var(--ink-600)]">
                Loading items...
              </p>
            </div>
          ) : grouped.length ? (
            grouped.map((group) => {
              const complete = isGroupComplete(group)
              const collapsed = collapsedDates.has(group.date)
              return (
                <div
                  key={group.date}
                  className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-6 shadow-[var(--shadow-soft)]"
                >
                  <button
                    type="button"
                    onClick={() => toggleDateCollapse(group.date)}
                    className="flex w-full items-center justify-between gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
                      {formatDateLabel(group.date)}
                    </p>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
                      {complete ? 'All done' : null}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${collapsed ? '' : 'rotate-180'}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>
                  {!collapsed ? (
                    <div className="mt-4 space-y-3">
                      {group.items.map((item, index) => {
                        const next = group.items[index + 1]
                        const isTravel = item.type === 'travel'
                        const sameLocation =
                          !!next &&
                          !isTravel &&
                          next.type !== 'travel' &&
                          ((item.place_id &&
                            next.place_id &&
                            item.place_id === next.place_id) ||
                            (item.lat != null &&
                              item.lng != null &&
                              next.lat != null &&
                              next.lng != null &&
                              item.lat === next.lat &&
                              item.lng === next.lng))
                        const sameLocationFromTravel =
                          !!next &&
                          isTravel &&
                          next.type !== 'travel' &&
                          ((item.to_place_id &&
                            next.place_id &&
                            item.to_place_id === next.place_id) ||
                            (item.to_lat != null &&
                              item.to_lng != null &&
                              next.lat != null &&
                              next.lng != null &&
                              item.to_lat === next.lat &&
                              item.to_lng === next.lng))
                        const showAutoTravel =
                          !!next &&
                          !isTravel &&
                          next.type !== 'travel' &&
                          !sameLocation
                        const showAutoTravelFromTravel =
                          !!next &&
                          isTravel &&
                          next.type !== 'travel' &&
                          !sameLocationFromTravel
                        const key = showAutoTravel
                          ? `${item.id}:${next.id}`
                          : null
                        const travelKey = showAutoTravelFromTravel
                          ? `travel:${item.id}:${next.id}`
                          : null
                        const info = key
                          ? travelInfo[key]
                          : travelKey
                            ? travelInfo[travelKey]
                            : null
                        const hasCoords =
                          showAutoTravel &&
                          item.lat != null &&
                          item.lng != null &&
                          next.lat != null &&
                          next.lng != null
                        const hasTravelCoords =
                          showAutoTravelFromTravel &&
                          item.to_lat != null &&
                          item.to_lng != null &&
                          next.lat != null &&
                          next.lng != null
                        const manualInfo = isTravel
                          ? manualTravelInfo[item.id]
                          : null
                        const hasManualTravelCoords =
                          isTravel &&
                          item.from_lat != null &&
                          item.from_lng != null &&
                          item.to_lat != null &&
                          item.to_lng != null
                        const fromDone = !!item.from_done
                        const toDone = !!item.to_done
                        const travelModeLabel =
                          item.travel_mode === 'car'
                            ? 'Car'
                            : item.travel_mode === 'transit'
                              ? 'Transit'
                              : 'Walk'

                        if (isTravel) {
                          return (
                            <div key={item.id} className="space-y-3">
                              <div className="rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3">
                                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                                  <div>
                                    <p
                                      className={`text-sm font-semibold ${
                                        fromDone
                                          ? 'text-[color:var(--ink-600)] line-through'
                                          : 'text-[color:var(--ink-900)]'
                                      }`}
                                    >
                                      {item.from_place_name || 'From location'}
                                    </p>
                                    <p className="text-xs text-[color:var(--ink-600)]">
                                      {item.start_time
                                        ? formatTimeLabel(item.start_time)
                                        : 'Anytime'}{' '}
                                      · travel · From · {travelModeLabel}
                                    </p>
                                    {item.notes ? (
                                      <p className="mt-2 text-xs text-[color:var(--ink-600)]">
                                        {item.notes}
                                      </p>
                                    ) : null}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleTravelDone(item, 'from_done')
                                    }
                                    className="h-fit rounded-full border border-[color:var(--sand-300)] bg-white px-3 py-1.5 text-[10px] font-semibold text-[color:var(--ink-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
                                  >
                                    {fromDone ? 'Undo' : 'Done'}
                                  </button>
                                </div>
                                <div className="mt-3">
                                  <div className="grid w-full grid-cols-2 overflow-hidden rounded-full border border-[color:var(--sand-300)] bg-[color:var(--sand-100)] text-[10px] font-semibold text-[color:var(--ink-700)]">
                                    <button
                                      type="button"
                                      onClick={() => openEditForm(item)}
                                      className="px-2.5 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(item)}
                                      className="border-l border-[color:var(--sand-300)] px-2.5 py-1.5 text-[color:var(--clay-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <a
                                href={buildTravelDirectionsUrl(item)}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-2xl border border-dashed border-[color:var(--sand-300)] px-4 py-3 text-xs text-[color:var(--ink-600)] transition hover:border-[color:var(--sun-400)] hover:text-[color:var(--ink-900)]"
                              >
                                {hasManualTravelCoords ? (
                                  manualInfo ? (
                                    <span>
                                      Travel{' '}
                                      {manualInfo.distanceMiles.toFixed(1)} mi ·{' '}
                                      {manualInfo.durationText} ·{' '}
                                      {travelModeLabel}
                                    </span>
                                  ) : (
                                    <span>Calculating travel time…</span>
                                  )
                                ) : (
                                  <span>Add locations to see travel time.</span>
                                )}
                              </a>

                              <div className="rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3">
                                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                                  <div>
                                    <p
                                      className={`text-sm font-semibold ${
                                        toDone
                                          ? 'text-[color:var(--ink-600)] line-through'
                                          : 'text-[color:var(--ink-900)]'
                                      }`}
                                    >
                                      {item.to_place_name || 'To location'}
                                    </p>
                                    <p className="text-xs text-[color:var(--ink-600)]">
                                      {item.start_time
                                        ? formatTimeLabel(item.start_time)
                                        : 'Anytime'}{' '}
                                      · travel · To · {travelModeLabel}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleTravelDone(item, 'to_done')
                                    }
                                    className="h-fit rounded-full border border-[color:var(--sand-300)] bg-white px-3 py-1.5 text-[10px] font-semibold text-[color:var(--ink-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
                                  >
                                    {toDone ? 'Undo' : 'Done'}
                                  </button>
                                </div>
                              </div>
                              {showAutoTravelFromTravel ? (
                                <a
                                  href={buildDirectionsUrlFromPoints(
                                    item.to_lat != null && item.to_lng != null
                                      ? `${item.to_lat},${item.to_lng}`
                                      : item.to_place_name || item.title,
                                    next.lat != null && next.lng != null
                                      ? `${next.lat},${next.lng}`
                                      : next.place_name || next.title,
                                    info?.mode || 'walk',
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-2xl border border-dashed border-[color:var(--sand-300)] px-4 py-3 text-xs text-[color:var(--ink-600)] transition hover:border-[color:var(--sun-400)] hover:text-[color:var(--ink-900)]"
                                >
                                  {hasTravelCoords ? (
                                    info ? (
                                      <span>
                                        Travel {info.distanceMiles.toFixed(1)}{' '}
                                        mi · {info.durationText} ·{' '}
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
                                    <span>
                                      Add locations to see travel time.
                                    </span>
                                  )}
                                </a>
                              ) : null}
                            </div>
                          )
                        }

                        return (
                          <div key={item.id} className="space-y-3">
                            <div className="rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3">
                              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                                <div>
                                  <p
                                    className={`text-sm font-semibold ${
                                      item.done && !isTravel
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
                                  className="h-fit rounded-full border border-[color:var(--sand-300)] bg-white px-3 py-1.5 text-[10px] font-semibold text-[color:var(--ink-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
                                >
                                  {item.done ? 'Undo' : 'Done'}
                                </button>
                              </div>
                              <div className="mt-3">
                                <div className="grid w-full grid-cols-2 overflow-hidden rounded-full border border-[color:var(--sand-300)] bg-[color:var(--sand-100)] text-[10px] font-semibold text-[color:var(--ink-700)]">
                                  <button
                                    type="button"
                                    onClick={() => openEditForm(item)}
                                    className="px-2.5 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(item)}
                                    className="border-l border-[color:var(--sand-300)] px-2.5 py-1.5 text-[color:var(--clay-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                            {showAutoTravel ? (
                              <a
                                href={buildDirectionsUrl(
                                  item,
                                  next,
                                  info?.mode || 'walk',
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-2xl border border-dashed border-[color:var(--sand-300)] px-4 py-3 text-xs text-[color:var(--ink-600)] transition hover:border-[color:var(--sun-400)] hover:text-[color:var(--ink-900)]"
                              >
                                {hasCoords ? (
                                  info ? (
                                    <span>
                                      Travel {info.distanceMiles.toFixed(1)} mi
                                      · {info.durationText} ·{' '}
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
                  ) : null}
                </div>
              )
            })
          ) : (
            <div className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-8 shadow-[var(--shadow-soft)]">
              <p className="text-sm text-[color:var(--ink-600)]">
                No itinerary items yet. Use the button above to add the first
                one.
              </p>
            </div>
          )}
        </section>
        <aside className="hidden min-[900px]:block">
          <div className="sticky top-8 rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-6 py-6 shadow-[var(--shadow-soft)]">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Add an item
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openAddForm('activity')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--sun-400)] px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] transition-colors hover:bg-[color:var(--sun-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                Activity
              </button>
              <button
                type="button"
                onClick={() => openAddForm('meal')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--sun-400)] px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] transition-colors hover:bg-[color:var(--sun-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
                Meal
              </button>
              <button
                type="button"
                onClick={() => openAddForm('travel')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--sun-400)] px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] transition-colors hover:bg-[color:var(--sun-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
                Travel
              </button>
              <button
                type="button"
                onClick={() => openAddForm('stay')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--sun-400)] px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] transition-colors hover:bg-[color:var(--sun-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 4v16" />
                  <path d="M2 8h18a2 2 0 0 1 2 2v10" />
                  <path d="M2 17h20" />
                  <path d="M6 8v9" />
                </svg>
                Stay
              </button>
              <button
                type="button"
                onClick={() => openAddForm('other')}
                className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--sun-400)] px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] transition-colors hover:bg-[color:var(--sun-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
                Other
              </button>
            </div>
          </div>
        </aside>
      </div>
      <button
        type="button"
        onClick={() => openAddForm()}
        className="fixed bottom-6 right-6 z-[8] rounded-full bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)] shadow-lg transition-all hover:bg-[color:var(--sun-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px] min-[900px]:hidden"
        aria-label="Add item"
      >
        Add item
      </button>
      {isFormOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--ink-900)]/40 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label={isEditMode ? 'Edit itinerary item' : 'Add itinerary item'}
        >
          <div className="w-full max-w-2xl rounded-3xl border border-[color:var(--sand-300)] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
                  {trip.name}
                </p>
                <h2 className="[font-family:var(--font-display)] text-2xl text-[color:var(--ink-900)]">
                  {isEditMode ? 'Edit item' : 'Add an item'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full border border-[color:var(--sand-300)] px-3 py-1.5 text-xs font-semibold text-[color:var(--ink-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              >
                Close
              </button>
            </div>
            <div className="mt-6 max-h-[70vh] overflow-x-hidden overflow-y-auto pr-1">
              {addForm}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
