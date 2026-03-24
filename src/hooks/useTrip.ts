'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Trip } from '../lib/types'
import { getTrips } from '../lib/api'
import { useAuth } from '../lib/auth'
import {
  readActiveTripId,
  readCachedTrips,
  setActiveTripId,
} from '../lib/offline'

function resolveActiveTrip(trips: Trip[], preferredId: string | null) {
  if (!trips.length) return null
  return (preferredId ? trips.find((t) => t.id === preferredId) ?? null : null) ?? trips[0]
}

export function useTrip() {
  const { session } = useAuth()
  const [trips, setTrips] = useState<Trip[]>(() => readCachedTrips())
  const [trip, setTrip] = useState<Trip | null>(() =>
    resolveActiveTrip(readCachedTrips(), readActiveTripId()),
  )
  const [loading, setLoading] = useState(() => readCachedTrips().length === 0)
  const [error, setError] = useState<string | null>(null)

  const loadTrip = useCallback(async () => {
    if (!session?.user) {
      setTrip(null)
      setTrips([])
      setLoading(false)
      return
    }

    // Only show spinner when there's nothing cached to show yet
    if (readCachedTrips().length === 0) setLoading(true)
    setError(null)
    try {
      const list = await getTrips()
      setTrips(list)
      if (!list.length) {
        setTrip(null)
        setActiveTripId(null)
      } else {
        const preferredId = readActiveTripId()
        const active = resolveActiveTrip(list, preferredId)!
        setTrip(active)
        setActiveTripId(active.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load trip.')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    loadTrip()
  }, [loadTrip])

  const setActiveTrip = (tripId: string) => {
    const selected = trips.find((entry) => entry.id === tripId) || null
    if (!selected) return
    setTrip(selected)
    setActiveTripId(selected.id)
  }

  return { trip, trips, loading, error, refreshTrip: loadTrip, setActiveTrip }
}
