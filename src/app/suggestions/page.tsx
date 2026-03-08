'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Bed, Compass, Eye, Plus, Utensils } from 'lucide-react'
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
                className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-6 py-5 shadow-[var(--shadow-soft)]"
              >
                <span className="inline-block rounded-full border border-[color:var(--sand-300)] bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--clay-600)]">
                  {suggestion.type}
                </span>
                <p className="mt-2 text-base font-semibold text-[color:var(--ink-900)]">
                  {suggestion.title}
                </p>
                {suggestion.notes ? (
                  <p className="mt-1.5 text-sm text-[color:var(--ink-600)]">
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

        <aside className="sticky top-6 h-fit">
          <div className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-6 py-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              New suggestion
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-600)]">
                  Type
                </p>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {(
                    [
                      { key: 'food', label: 'Food', Icon: Utensils, cols: 'col-span-2' },
                      { key: 'stay', label: 'Stay', Icon: Bed, cols: 'col-span-2' },
                      { key: 'sight', label: 'Sight', Icon: Eye, cols: 'col-span-2' },
                      { key: 'experience', label: 'Experience', Icon: Compass, cols: 'col-span-3' },
                      { key: 'other', label: 'Other', Icon: Plus, cols: 'col-span-3' },
                    ] as const
                  ).map(({ key, label, Icon, cols }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setType(key)}
                      className={`${cols} flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px] ${
                        type === key
                          ? 'border-[color:var(--sun-500)] bg-[color:var(--sun-400)] text-[color:var(--ink-900)]'
                          : 'border-[color:var(--sand-300)] bg-white text-[color:var(--ink-700)] hover:border-[color:var(--sun-400)]'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-600)]">
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-[color:var(--ink-900)] placeholder:text-[color:var(--ink-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[2px]"
                  placeholder="Omakase dinner"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-600)]">
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 h-24 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal text-[color:var(--ink-900)] placeholder:text-[color:var(--ink-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[2px]"
                  placeholder="Great reviews and a calm atmosphere."
                />
              </label>
              <button
                type="button"
                onClick={handleAdd}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)] transition-colors hover:bg-[color:var(--sun-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px] disabled:opacity-60"
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add suggestion
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
