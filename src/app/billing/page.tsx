'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../../lib/auth'

export default function BillingPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const user = session?.user

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/')
    }
  }, [authLoading, router, user])

  const handleCheckout = () => {
    router.push('/billing/checkout')
  }

  if (authLoading) {
    return (
      <main className="page-shell">
        <div className="section-shell mx-auto max-w-4xl px-8 py-12">
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
    <main className="page-shell">
      <section className="section-shell mx-auto max-w-5xl px-8 py-12">
        <div className="billing-head">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Billing
            </p>
            <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
              Simple billing, $5 per trip.
            </h1>
          </div>
          <span className="stripe-chip">Powered by Stripe</span>
        </div>

        <div className="billing-grid">
          <div className="billing-card">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Payment
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
              className="focus-ring mt-5 rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
            >
              Continue to checkout
            </button>
          </div>
        </div>

        <div className="billing-summary">
          <div className="billing-summary-card">
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
          <div className="billing-summary-card">
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
          <div className="billing-summary-card">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Invoices
            </p>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--ink-900)]">
              Stripe
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-600)]">
              Stripe delivers receipts and keeps your billing history tidy.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
