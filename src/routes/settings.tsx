import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { updateTripName } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useTrip } from '../hooks/useTrip'

export const Route = createFileRoute('/settings')({ component: Settings })

function Settings() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading, refreshTrip } = useTrip()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const isAuthed = !!session?.user

  useEffect(() => {
    if (authLoading) return
    if (!isAuthed) {
      navigate({ to: '/' })
    }
  }, [authLoading, isAuthed, navigate])

  useEffect(() => {
    if (!trip) return
    setName(trip.name)
  }, [trip])

  const handleSave = async () => {
    if (!trip) return
    if (!name.trim()) {
      setMessage('Trip name required.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await updateTripName(trip.id, name.trim())
      await refreshTrip()
      setMessage('Trip name updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update trip.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyCode = async () => {
    if (!trip) return
    await navigator.clipboard.writeText(trip.code)
    setMessage('Invite code copied to clipboard.')
  }

  if (authLoading || tripLoading) {
    return (
      <main className="page-shell">
        <div className="section-shell mx-auto max-w-4xl px-8 py-12">
          <p className="text-sm text-[color:var(--ink-600)]">Loading settings...</p>
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
        <div className="section-shell mx-auto max-w-4xl px-8 py-12">
          <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
            Create or join a trip to access settings.
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
      <div className="section-shell mx-auto max-w-4xl px-8 py-12">
        <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
          Settings
        </p>
        <h1 className="font-display text-3xl text-[color:var(--ink-900)]">Trip settings</h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Trip name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="focus-ring w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {message ? (
              <p className="rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--ink-700)]">
                {message}
              </p>
            ) : null}
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Invite code
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[0.2em] text-[color:var(--ink-900)]">
              {trip.code}
            </p>
            <p className="mt-3 text-sm text-[color:var(--ink-600)]">
              Share this code to let someone join your trip.
            </p>
            <button
              type="button"
              onClick={handleCopyCode}
              className="focus-ring mt-4 rounded-full border border-[color:var(--sand-300)] px-4 py-2 text-sm font-semibold text-[color:var(--ink-700)]"
            >
              Copy code
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
