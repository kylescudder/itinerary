'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { createStripeCheckoutSession } from '../../../lib/billing'
import { useAuth } from '../../../lib/auth'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

function BillingCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, loading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const user = session?.user
  const purchaseType =
    searchParams.get('type') === 'lifetime' ? 'lifetime' : 'trip'

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/')
    }
  }, [authLoading, router, user])

  const fetchClientSecret = useCallback(async () => {
    setError(null)
    try {
      return await createStripeCheckoutSession({
        email: user?.email ?? null,
        type: purchaseType,
      })
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
        <div className="mx-auto max-w-4xl rounded-[20px] border border-[rgba(234,203,213,0.55)] bg-[rgba(254,249,250,0.9)] px-8 py-12 shadow-[var(--shadow-soft)]">
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
        <section className="mx-auto max-w-4xl rounded-[20px] border border-[rgba(234,203,213,0.55)] bg-[rgba(254,249,250,0.9)] px-8 py-12 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-[color:var(--clay-600)]">
            Missing Stripe publishable key. Add
            `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your `.env` to enable
            checkout.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-[20px] border border-[rgba(234,203,213,0.55)] bg-[rgba(254,249,250,0.9)] px-8 py-12 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Checkout
            </p>
            <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
              {purchaseType === 'lifetime'
                ? 'Lifetime access — pay once, use forever.'
                : 'Pay $5 to unlock this trip.'}
            </h1>
          </div>
        </div>

        <div className="-mx-8 min-h-[560px] w-[calc(100%+4rem)] [&_iframe]:w-full">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
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

export default function BillingCheckoutPage() {
  return (
    <Suspense>
      <BillingCheckoutContent />
    </Suspense>
  )
}
