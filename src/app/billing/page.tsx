'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../../lib/auth'

export default function BillingPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const user = session?.user
  const hasLifetimeAccess = !!user?.user_metadata?.lifetime_access

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/')
    }
  }, [authLoading, router, user])

  const handleCheckout = () => {
    router.push('/trip')
  }

  const handleLifetimeCheckout = () => {
    router.push('/billing/checkout?type=lifetime')
  }

  if (authLoading) {
    return (
      <main className="min-h-screen px-[clamp(16px,3vw,32px)] pt-8 pb-[60px]">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-[color:var(--ink-600)]">
            Loading billing...
          </p>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen px-[clamp(16px,3vw,32px)] pt-8 pb-[60px]">
      <section className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Billing
            </p>
            <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
              Simple billing, $5 per trip.
            </h1>
          </div>
        </div>

        {hasLifetimeAccess ? (
          <div className="mb-6 rounded-2xl border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.92)] px-5 py-4 text-sm text-[color:var(--ink-700)]">
            You already have lifetime access — create as many trips as you like at no extra charge.
          </div>
        ) : null}

        <div className="grid gap-[18px] min-[700px]:grid-cols-2">
          <div className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.92)] p-[22px] shadow-[var(--shadow-card)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Per trip
            </p>
            <p className="mt-4 text-lg font-semibold text-[color:var(--ink-900)]">
              Pay for a new trip
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-600)]">
              We charge a flat $5 per trip. Checkout is embedded so you never
              leave the app.
            </p>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={hasLifetimeAccess}
              className="mt-5 rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create a trip
            </button>
          </div>
          <div className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.92)] p-[22px] shadow-[var(--shadow-card)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Lifetime
            </p>
            <p className="mt-4 text-lg font-semibold text-[color:var(--ink-900)]">
              Unlimited trips, forever
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-600)]">
              Pay once and create as many trips as you like. No further charges,
              ever.
            </p>
            <button
              type="button"
              onClick={handleLifetimeCheckout}
              disabled={hasLifetimeAccess}
              className="mt-5 rounded-full bg-[color:var(--ink-900)] px-6 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {hasLifetimeAccess ? 'Already activated' : 'Get lifetime access'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-[14px] min-[900px]:grid-cols-[repeat(3,minmax(0,1fr))]">
          <div className="rounded-[20px] border border-dashed border-[rgba(234,203,213,0.7)] bg-[rgba(255,255,255,0.8)] p-[18px]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Current rate
            </p>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--ink-900)]">
              $5 per trip
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-600)]">
              The price is the same no matter how many travelers you invite.
            </p>
          </div>
          <div className="rounded-[20px] border border-dashed border-[rgba(234,203,213,0.7)] bg-[rgba(255,255,255,0.8)] p-[18px]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Extras
            </p>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--ink-900)]">
              $0
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-600)]">
              No add-ons, no tier upgrades, and no usage overages.
            </p>
          </div>
          <div className="rounded-[20px] border border-dashed border-[rgba(234,203,213,0.7)] bg-[rgba(255,255,255,0.8)] p-[18px]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              No subscription
            </p>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--ink-900)]">
              Pay as you go
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-600)]">
              Only pay for what you need — no recurring charges, no surprises.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
