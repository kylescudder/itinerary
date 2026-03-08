'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { updateTripDetails } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useTrip } from '../../hooks/useTrip'

const normalizeDateValue = (value?: string | null) =>
  value ? value.split('T')[0] : ''

export default function SettingsPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading, refreshTrip } = useTrip()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const isAuthed = !!session?.user

  useEffect(() => {
    if (authLoading) return
    if (!isAuthed) {
      router.replace('/')
    }
  }, [authLoading, isAuthed, router])

  useEffect(() => {
    if (!trip) return
    setName(trip.name)
    setStartDate(normalizeDateValue(trip.start_date))
    setEndDate(normalizeDateValue(trip.end_date))
  }, [trip])

  const handleSave = async () => {
    if (!trip) return
    if (!name.trim()) {
      setMessage('Trip name required.')
      return
    }
    if (startDate && endDate && endDate < startDate) {
      setMessage('End date must be after the start date.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await updateTripDetails(trip.id, {
        name: name.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
      })
      await refreshTrip()
      setMessage('Trip details updated.')
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
      <main className="min-h-screen px-[clamp(16px,3vw,32px)] pt-8 pb-[60px]">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-[color:var(--ink-600)]">
            Loading settings...
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
      <main className="min-h-screen px-[clamp(16px,3vw,32px)] pt-8 pb-[60px]">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
          <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
            Create or join a trip to access settings.
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
    <main className="min-h-screen px-[clamp(16px,3vw,32px)] pt-8 pb-[60px]">
      <div className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
          Settings
        </p>
        <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
          Trip settings
        </h1>

        <div className="mt-8 grid gap-6 min-[900px]:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-[color:var(--ink-700)]">
              Trip name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
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
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {message ? (
              <p className="rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--ink-700)]">
                {message}
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-[rgba(234,203,213,0.6)] bg-[rgba(254,249,250,0.9)] p-6 shadow-[var(--shadow-card)] backdrop-blur-[16px]">
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
              className="mt-4 rounded-full border border-[color:var(--sand-300)] px-4 py-2 text-sm font-semibold text-[color:var(--ink-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
            >
              Copy code
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
