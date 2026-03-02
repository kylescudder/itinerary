'use client'

import { useRouter } from 'next/navigation'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createStripeCheckoutSession } from '../../../lib/billing'
import { useAuth } from '../../../lib/auth'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export default function BillingCheckoutPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const user = session?.user

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/')
    }
  }, [authLoading, router, user])

  const fetchClientSecret = useCallback(async () => {
    setError(null)
    try {
      return await createStripeCheckoutSession({ email: user?.email ?? null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout.')
      throw err
    }
  }, [user?.email])

  const options = useMemo(
    () => ({
      fetchClientSecret,
    }),
    [fetchClientSecret],
  )

  if (authLoading) {
    return (
      <main className="page-shell">
        <div className="section-shell mx-auto max-w-4xl px-8 py-12">
          <p className="text-sm text-[color:var(--ink-600)]">
            Loading checkout...
          </p>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  if (!stripePromise) {
    return (
      <main className="page-shell">
        <section className="section-shell mx-auto max-w-4xl px-8 py-12">
          <div className="billing-card">
            <p className="text-sm text-[color:var(--clay-600)]">
              Missing Stripe publishable key. Add
              `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your `.env` to enable
              checkout.
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="section-shell mx-auto max-w-4xl px-8 py-12">
        <div className="billing-head">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Checkout
            </p>
            <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
              Pay $5 to unlock this trip.
            </h1>
          </div>
        </div>

        <div className="billing-card">
          <div className="embedded-checkout">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--clay-600)]">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  )
}
