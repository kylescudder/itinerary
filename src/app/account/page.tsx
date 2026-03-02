'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../../lib/auth'
import { useTrip } from '../../hooks/useTrip'

export default function AccountPage() {
  const router = useRouter()
  const { session, loading: authLoading, signOut } = useAuth()
  const { trip, loading: tripLoading } = useTrip()
  const user = session?.user
  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'Traveler'

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/')
    }
  }, [authLoading, router, user])

  if (authLoading || tripLoading) {
    return (
      <main className="page-shell">
        <div className="section-shell mx-auto max-w-4xl px-8 py-12">
          <p className="text-sm text-[color:var(--ink-600)]">
            Loading account...
          </p>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="page-shell">
      <section className="section-shell mx-auto grid max-w-5xl gap-10 px-8 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
            Account
          </p>
          <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
            Welcome back, {name}.
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
            Keep your team organized and stay on top of billing without losing
            momentum.
          </p>

          <div className="account-grid">
            <div className="account-card">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
                Profile
              </p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--ink-900)]">
                {name}
              </p>
              <p className="text-sm text-[color:var(--ink-600)]">
                {user.email}
              </p>
            </div>
            <div className="account-card">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
                Active trip
              </p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--ink-900)]">
                {trip ? trip.name : 'No trip selected'}
              </p>
              <p className="text-sm text-[color:var(--ink-600)]">
                {trip
                  ? 'Manage collaborators in the trip settings.'
                  : 'Create or join a trip to unlock shared planning.'}
              </p>
            </div>
          </div>

          <div className="account-actions">
            <button
              type="button"
              className="focus-ring rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
              onClick={() => router.push('/billing')}
            >
              Go to billing
            </button>
            <button
              type="button"
              className="focus-ring rounded-full border border-[color:var(--sand-300)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-700)]"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
            Usage snapshot
          </p>
          <div className="mt-5 grid gap-4">
            <div className="data-pill">
              <span>Trips created</span>
              <strong>0</strong>
            </div>
            <div className="data-pill">
              <span>Trip price</span>
              <strong>$5</strong>
            </div>
            <div className="data-pill">
              <span>Billing method</span>
              <strong>Stripe</strong>
            </div>
          </div>
          <p className="mt-5 text-sm text-[color:var(--ink-600)]">
            Each trip is billed once, with a single Stripe receipt per trip.
          </p>
        </div>
      </section>
    </main>
  )
}
