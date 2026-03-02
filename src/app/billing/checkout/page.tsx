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
      <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
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
      <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
        <section className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
          <div className="relative grid gap-[14px] rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.92)] p-[22px] shadow-[var(--shadow-card)]">
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
    <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
      <section className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Checkout
            </p>
            <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
              Pay $5 to unlock this trip.
            </h1>
          </div>
        </div>

        <div className="relative grid gap-[14px] rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.92)] p-[22px] shadow-[var(--shadow-card)]">
          <div className="min-h-[560px] [&_iframe]:w-full">
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
