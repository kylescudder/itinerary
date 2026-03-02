'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { createSuggestion, getSuggestions } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useTrip } from '../../hooks/useTrip'
import { useOfflineSync } from '../../hooks/useOfflineSync'
import type { PlaceSuggestion } from '../../lib/types'

const suggestionTypes = ['food', 'stay', 'experience', 'sight', 'other']

export default function SuggestionsPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const { trip, trips, loading: tripLoading, setActiveTrip } = useTrip()
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
      router.replace('/')
    }
  }, [authLoading, isAuthed, router])

  const loadSuggestions = useCallback(async () => {
    if (!trip) return
    setLoading(true)
    setError(null)
    try {
      const data = await getSuggestions(trip.id)
      setItems(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load suggestions.',
      )
    } finally {
      setLoading(false)
    }
  }, [trip])

  useEffect(() => {
    if (!trip) return
    loadSuggestions()
  }, [trip, loadSuggestions])

  useEffect(() => {
    if (!trip) return
    setItems([])
  }, [trip?.id])

  useOfflineSync(() => {
    if (!trip) return
    loadSuggestions()
  })

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
      <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
        <div className="mx-auto max-w-5xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-[color:var(--ink-600)]">
            Loading suggestions...
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
            Create or join a trip to collect suggestions.
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
    <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
      <div className="mx-auto grid max-w-6xl gap-8 min-[900px]:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-8 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
                  {trip.name}
                </p>
                <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
                  Suggestions
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

          {items.length ? (
            items.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-6 shadow-[var(--shadow-soft)]"
              >
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
            <div className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-8 shadow-[var(--shadow-soft)]">
              <p className="text-sm text-[color:var(--ink-600)]">
                No suggestions yet. Add the first one from the form on the
                right.
              </p>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-8 shadow-[var(--shadow-soft)]">
          <h2 className="[font-family:var(--font-display)] text-2xl text-[color:var(--ink-900)]">
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
              className="w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
            >
              {loading ? 'Saving...' : 'Add suggestion'}
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}
