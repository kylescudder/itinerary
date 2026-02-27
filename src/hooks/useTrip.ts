import { useCallback, useEffect, useState } from 'react'
import type { Trip } from '../lib/types'
import { getTrips } from '../lib/api'
import { useAuth } from '../lib/auth'
import { readActiveTripId, setActiveTripId } from '../lib/offline'

export function useTrip() {
  const { session } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTrip = useCallback(async () => {
    if (!session?.user) {
      setTrip(null)
      setTrips([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const list = await getTrips()
      setTrips(list)
      if (!list.length) {
        setTrip(null)
        setActiveTripId(null)
      } else {
        const preferredId = readActiveTripId()
        const active =
          (preferredId && list.find((entry) => entry.id === preferredId)) ||
          list[0]
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
