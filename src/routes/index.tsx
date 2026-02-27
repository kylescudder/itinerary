import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTrip } from '../hooks/useTrip'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading } = useTrip()
  const [authError, setAuthError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (authLoading || tripLoading) return
    if (!session?.user) return
    if (trip) {
      navigate({ to: '/itinerary' })
    } else {
      navigate({ to: '/trip' })
    }
  }, [authLoading, navigate, session?.user, trip, tripLoading])

  const handleSignIn = async () => {
    setAuthError(null)
    setSigningIn(true)
    const redirectTo = `${window.location.origin}/login`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      setAuthError(error.message)
      setSigningIn(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="section-shell mx-auto grid max-w-5xl gap-10 px-8 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
            Itinerary planner
          </p>
          <h1 className="font-display text-4xl text-[color:var(--ink-900)] sm:text-5xl">
            Build a shared plan, keep every detail in sync, and move together.
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
            Create a trip, add itinerary items and wish-list suggestions, and
            share a single invite code with everyone who needs to stay aligned.
          </p>
          <div className="flex flex-wrap gap-3">
            {session?.user ? (
              <button
                className="focus-ring rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
                onClick={() => navigate({ to: trip ? '/itinerary' : '/trip' })}
                type="button"
              >
                Go to your plan
              </button>
            ) : (
              <button
                className="focus-ring w-full rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)] sm:w-auto"
                onClick={handleSignIn}
                type="button"
                disabled={signingIn}
              >
                {signingIn ? 'Connecting...' : 'Sign in with Google'}
              </button>
            )}
            {session?.user ? (
              <button
                className="focus-ring rounded-full border border-[color:var(--sand-300)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-700)]"
                onClick={() => navigate({ to: '/trip' })}
                type="button"
              >
                Create or join a trip
              </button>
            ) : null}
          </div>
          {authError ? (
            <p className="mt-4 rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--clay-600)]">
              {authError}
            </p>
          ) : null}
        </div>
        <div className="glass-panel rounded-3xl p-6">
          <div className="space-y-4">
            <div className="rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--ink-700)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
                Today
              </p>
              <p className="font-semibold text-[color:var(--ink-900)]">
                Sunrise market stroll
              </p>
              <p className="text-xs text-[color:var(--ink-600)]">7:30 AM · Gion</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--sand-300)] px-4 py-3 text-sm">
              <p className="font-semibold text-[color:var(--ink-900)]">Tea ceremony</p>
              <p className="text-xs text-[color:var(--ink-600)]">11:00 AM · Kyoto</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--sand-300)] px-4 py-3 text-sm">
              <p className="font-semibold text-[color:var(--ink-900)]">Dinner at Pontocho</p>
              <p className="text-xs text-[color:var(--ink-600)]">7:00 PM · Reservations</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
