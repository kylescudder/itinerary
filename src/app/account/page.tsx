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
  const hasLifetimeAccess = !!user?.user_metadata?.lifetime_access
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
      <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
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
    <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
      <section className="mx-auto grid max-w-4xl gap-10 rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)] min-[900px]:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
            Account
          </p>
          <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
            Welcome back, {name}.
          </h1>
          <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
            Keep your team organized and stay on top of billing without losing
            momentum.
          </p>

          <div className="grid gap-4 min-[900px]:grid-cols-[repeat(2,minmax(0,1fr))]">
            <div className="rounded-[20px] border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.9)] p-[18px] shadow-[var(--shadow-card)]">
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
            <div className="rounded-[20px] border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.9)] p-[18px] shadow-[var(--shadow-card)]">
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

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              onClick={() => router.push('/billing')}
            >
              Go to billing
            </button>
            <button
              type="button"
              className="rounded-full border border-[color:var(--sand-300)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-[rgba(234,203,213,0.6)] bg-[rgba(254,249,250,0.9)] p-6 shadow-[var(--shadow-card)] backdrop-blur-[16px]">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
            Usage snapshot
          </p>
          <div className="mt-5 grid gap-4">
            <div className="flex items-center justify-between gap-[10px] rounded-[16px] border border-[rgba(234,203,213,0.6)] bg-[rgba(255,255,255,0.8)] px-[14px] py-3 text-[0.85rem] text-[color:var(--ink-700)]">
              <span>Trips created</span>
              <strong className="text-[0.95rem] text-[color:var(--ink-900)]">
                0
              </strong>
            </div>
            <div className="flex items-center justify-between gap-[10px] rounded-[16px] border border-[rgba(234,203,213,0.6)] bg-[rgba(255,255,255,0.8)] px-[14px] py-3 text-[0.85rem] text-[color:var(--ink-700)]">
              <span>Trip price</span>
              <strong className="text-[0.95rem] text-[color:var(--ink-900)]">
                {hasLifetimeAccess ? 'Free' : '$5'}
              </strong>
            </div>
            {!hasLifetimeAccess ? (
              <div className="flex items-center justify-between gap-[10px] rounded-[16px] border border-[rgba(234,203,213,0.6)] bg-[rgba(255,255,255,0.8)] px-[14px] py-3 text-[0.85rem] text-[color:var(--ink-700)]">
                <span>Billing method</span>
                <strong className="text-[0.95rem] text-[color:var(--ink-900)]">
                  Stripe
                </strong>
              </div>
            ) : null}
            {hasLifetimeAccess ? (
              <div className="flex items-center justify-between gap-[10px] rounded-[16px] border border-[rgba(234,203,213,0.6)] bg-[rgba(255,255,255,0.8)] px-[14px] py-3 text-[0.85rem] text-[color:var(--ink-700)]">
                <span>Access</span>
                <strong className="text-[0.95rem] text-[color:var(--ink-900)]">
                  Lifetime
                </strong>
              </div>
            ) : null}
          </div>
          <p className="mt-5 text-sm text-[color:var(--ink-600)]">
            {hasLifetimeAccess
              ? 'You have lifetime access — no further charges, ever.'
              : 'Each trip is billed once, with a single Stripe receipt per trip.'}
          </p>
        </div>
      </section>
    </main>
  )
}
