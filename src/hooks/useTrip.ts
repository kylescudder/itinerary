import { useCallback, useEffect, useState } from 'react'
import type { Trip } from '../lib/types'
import { getTrip } from '../lib/api'
import { useAuth } from '../lib/auth'

export function useTrip() {
  const { session } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTrip = useCallback(async () => {
    if (!session?.user) {
      setTrip(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const current = await getTrip()
      setTrip(current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load trip.')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    loadTrip()
  }, [loadTrip])

  return { trip, loading, error, refreshTrip: loadTrip }
}
