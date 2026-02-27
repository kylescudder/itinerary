import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createTrip, joinTrip } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useTrip } from '../hooks/useTrip'

export const Route = createFileRoute('/trip')({ component: TripSetup })

function TripSetup() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading, refreshTrip } = useTrip()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const isAuthed = !!session?.user

  useEffect(() => {
    if (authLoading) return
    if (!isAuthed) {
      navigate({ to: '/' })
    }
  }, [authLoading, isAuthed, navigate])

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please add a trip name.')
      return
    }
    setWorking(true)
    setError(null)
    try {
      await createTrip(name.trim())
      await refreshTrip()
      navigate({ to: '/itinerary' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create trip.')
    } finally {
      setWorking(false)
    }
  }

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Please enter a code.')
      return
    }
    setWorking(true)
    setError(null)
    try {
      await joinTrip(code.trim().toUpperCase())
      await refreshTrip()
      navigate({ to: '/itinerary' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join trip.')
    } finally {
      setWorking(false)
    }
  }

  if (authLoading || tripLoading) {
    return (
      <main className="page-shell">
        <div className="section-shell mx-auto max-w-3xl px-8 py-12">
          <p className="text-sm text-[color:var(--ink-600)]">Loading your trip...</p>
        </div>
      </main>
    )
  }

  if (!isAuthed) {
    return null
  }

  if (trip) {
    return (
      <main className="page-shell">
        <div className="section-shell mx-auto max-w-3xl px-8 py-12">
          <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
            Your trip is ready.
          </h1>
          <p className="mt-3 text-[color:var(--ink-600)]">
            {trip.name} · Invite code {trip.code}
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/itinerary' })}
            className="focus-ring mt-6 rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
          >
            Go to itinerary
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="section-shell mx-auto max-w-3xl px-8 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
            Set up your trip
          </p>
          <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
            Create a shared plan or join with a code.
          </h1>
        </div>

        <div className="flex gap-3 rounded-full bg-[color:var(--sand-200)] p-1">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`focus-ring flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
              mode === 'create'
                ? 'bg-[color:var(--sand-50)] text-[color:var(--ink-900)]'
                : 'text-[color:var(--ink-700)]'
            }`}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`focus-ring flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
              mode === 'join'
                ? 'bg-[color:var(--sand-50)] text-[color:var(--ink-900)]'
                : 'text-[color:var(--ink-700)]'
            }`}
          >
            Join
          </button>
        </div>

        <div className="glass-panel mt-6 rounded-3xl p-6">
          {mode === 'create' ? (
            <div className="space-y-6">
              <label className="text-sm font-semibold text-[color:var(--ink-700)]">
                Trip name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Japan honeymoon"
                  className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={handleCreate}
                disabled={working}
                className="focus-ring mt-6 w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
              >
                {working ? 'Creating...' : 'Create trip'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <label className="text-sm font-semibold text-[color:var(--ink-700)]">
                Invite code
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="ABC123"
                  className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm uppercase tracking-[0.2em]"
                />
              </label>
              <button
                type="button"
                onClick={handleJoin}
                disabled={working}
                className="focus-ring mt-6 w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
              >
                {working ? 'Joining...' : 'Join trip'}
              </button>
            </div>
          )}
          {error ? (
            <p className="mt-4 rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--clay-600)]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
