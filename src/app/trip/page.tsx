'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createTrip, joinTrip } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useTrip } from '../../hooks/useTrip'

export default function TripPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const {
    trip,
    trips,
    loading: tripLoading,
    refreshTrip,
    setActiveTrip,
  } = useTrip()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const formVisible = showForm || !trips.length
  const isAuthed = !!session?.user
  const hasLifetimeAccess = !!session?.user?.user_metadata?.lifetime_access
  const pendingTripKey = 'itinerary:pending-trip'

  useEffect(() => {
    if (authLoading) return
    if (!isAuthed) {
      router.replace('/')
    }
  }, [authLoading, isAuthed, router])

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please add a trip name.')
      return
    }
    if (startDate && endDate && endDate < startDate) {
      setError('End date must be after the start date.')
      return
    }
    if (!hasLifetimeAccess) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          pendingTripKey,
          JSON.stringify({
            name: name.trim(),
            startDate: startDate || null,
            endDate: endDate || null,
          }),
        )
      }
      router.push('/billing/checkout')
      return
    }
    setWorking(true)
    setError(null)
    try {
      await createTrip(name.trim(), {
        startDate: startDate || null,
        endDate: endDate || null,
      })
      await refreshTrip()
      router.push('/itinerary')
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
      router.push('/itinerary')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join trip.')
    } finally {
      setWorking(false)
    }
  }

  if (authLoading || tripLoading) {
    return (
      <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-[color:var(--ink-600)]">
            Loading your trip...
          </p>
        </div>
      </main>
    )
  }

  if (!isAuthed) {
    return null
  }

  const openForm = () => {
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
      <div className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="[font-family:var(--font-display)] text-2xl text-[color:var(--ink-900)]">
            {trips.length ? 'Your trips' : 'Get started'}
          </h1>
          <button
            type="button"
            onClick={() => (formVisible ? setShowForm(false) : openForm())}
            className={`${formVisible ? 'flex' : 'hidden md:flex'} items-center gap-2 rounded-full bg-[color:var(--sun-400)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]`}
          >
            <span
              className="inline-block transition-transform duration-300"
              style={{ transform: formVisible ? 'rotate(45deg)' : 'rotate(0deg)' }}
            >
              +
            </span>
            {formVisible ? 'Cancel' : 'New trip'}
          </button>
        </div>

        <div
          className="grid transition-[grid-template-rows] duration-500 ease-in-out"
          style={{ gridTemplateRows: formVisible ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="pt-6">
              <div className="flex gap-3 rounded-full bg-[color:var(--sand-200)] p-1">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px] ${
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
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px] ${
                    mode === 'join'
                      ? 'bg-[color:var(--sand-50)] text-[color:var(--ink-900)]'
                      : 'text-[color:var(--ink-700)]'
                  }`}
                >
                  Join
                </button>
              </div>

              <div className="mt-4 rounded-3xl border border-[rgba(234,203,213,0.6)] bg-[rgba(254,249,250,0.9)] p-6 shadow-[var(--shadow-card)] backdrop-blur-[16px]">
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-[color:var(--ink-700)]">
                        Start date
                        <input
                          type="date"
                          value={startDate}
                          onChange={(event) => setStartDate(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                        />
                      </label>
                      <label className="text-sm font-semibold text-[color:var(--ink-700)]">
                        End date
                        <input
                          type="date"
                          min={startDate || undefined}
                          value={endDate}
                          onChange={(event) => setEndDate(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={working}
                      className="mt-6 w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
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
                      className="mt-6 w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
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
          </div>
        </div>

        {trips.length ? (
          <div className="mt-6 space-y-3">
            {trips.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                    {entry.name}
                  </p>
                  <p className="text-xs text-[color:var(--ink-600)]">
                    Invite code {entry.code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {trip?.id === entry.id ? (
                    <span className="rounded-full bg-[color:var(--sand-200)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-700)]">
                      Active
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTrip(entry.id)
                      router.push('/itinerary')
                    }}
                    className="rounded-full border border-[color:var(--sand-300)] px-4 py-2 text-xs font-semibold text-[color:var(--ink-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
                  >
                    View itinerary
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={openForm}
        className="fixed bottom-6 right-6 z-[8] rounded-full bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)] shadow-lg transition-all hover:bg-[color:var(--sun-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px] md:hidden"
        style={{
          opacity: formVisible ? 0 : 1,
          pointerEvents: formVisible ? 'none' : 'auto',
        }}
      >
        New trip
      </button>
    </main>
  )
}
