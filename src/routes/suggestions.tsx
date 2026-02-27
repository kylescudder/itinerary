import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createSuggestion, getSuggestions } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useTrip } from '../hooks/useTrip'
import type { PlaceSuggestion } from '../lib/types'

export const Route = createFileRoute('/suggestions')({ component: Suggestions })

const suggestionTypes = ['food', 'stay', 'experience', 'sight', 'other']

function Suggestions() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading } = useTrip()
  const [items, setItems] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [type, setType] = useState(suggestionTypes[0])
  const isAuthed = !!session?.user

  useEffect(() => {
    if (authLoading) return
    if (!isAuthed) {
      navigate({ to: '/' })
    }
  }, [authLoading, isAuthed, navigate])

  useEffect(() => {
    if (!trip) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getSuggestions()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load suggestions.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [trip])

  const handleAdd = async () => {
    if (!trip) return
    if (!title.trim()) {
      setError('Please add a suggestion title.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const created = await createSuggestion({
        trip_id: trip.id,
        type,
        title: title.trim(),
        notes: notes.trim() || null,
        lat: null,
        lng: null,
      })
      setItems((prev) => [created, ...prev])
      setTitle('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add suggestion.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || tripLoading) {
    return (
      <main className="page-shell">
        <div className="section-shell mx-auto max-w-5xl px-8 py-12">
          <p className="text-sm text-[color:var(--ink-600)]">Loading suggestions...</p>
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
            Create or join a trip to collect suggestions.
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
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              {trip.name}
            </p>
            <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
              Suggestions
            </h1>
          </div>

          {error ? (
            <div className="rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--clay-600)]">
              {error}
            </div>
          ) : null}

          {items.length ? (
            items.map((suggestion) => (
              <div key={suggestion.id} className="section-shell px-8 py-6">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
                  {suggestion.type}
                </p>
                <p className="mt-2 text-base font-semibold text-[color:var(--ink-900)]">
                  {suggestion.title}
                </p>
                {suggestion.notes ? (
                  <p className="mt-2 text-sm text-[color:var(--ink-600)]">
                    {suggestion.notes}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="section-shell px-8 py-8">
              <p className="text-sm text-[color:var(--ink-600)]">
                No suggestions yet. Add the first one from the form on the right.
              </p>
            </div>
          )}
        </section>

        <aside className="section-shell h-fit px-8 py-8">
          <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
            Add a suggestion
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-600)]">
            Capture places to consider as you build the final plan.
          </p>
          <div className="mt-6 space-y-4">
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                placeholder="Omakase dinner"
              />
            </label>
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Type
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
              >
                {suggestionTypes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 h-28 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                placeholder="Great reviews and a calm atmosphere."
              />
            </label>
            <button
              type="button"
              onClick={handleAdd}
              disabled={loading}
              className="focus-ring w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
            >
              {loading ? 'Saving...' : 'Add suggestion'}
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}
