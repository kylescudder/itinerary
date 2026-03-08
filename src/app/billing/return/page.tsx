'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { fetchStripeSessionStatus } from '../../../lib/billing'
import { createTrip } from '../../../lib/api'
import { useAuth } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'

function BillingReturnContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, loading: authLoading } = useAuth()
  const [status, setStatus] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null)
  const [purchaseType, setPurchaseType] = useState<'trip' | 'lifetime'>('trip')
  const [error, setError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const createTriggered = useRef(false)
  const user = session?.user
  const pendingTripKey = 'itinerary:pending-trip'

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/')
    }
  }, [authLoading, router, user])

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setError('Missing Stripe session.')
      return
    }

    fetchStripeSessionStatus(sessionId)
      .then((data) => {
        setStatus(data.status)
        setEmail(data.customer_email ?? null)
        setPaymentIntent(data.payment_intent ?? null)
        setPurchaseType(data.purchase_type ?? 'trip')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load status.')
      })
  }, [searchParams])

  useEffect(() => {
    if (status !== 'complete' || !user || createTriggered.current) return
    if (typeof window === 'undefined') return
    const sessionId = searchParams.get('session_id')

    createTriggered.current = true
    setCreating(true)
    setCreateError(null)

    if (purchaseType === 'lifetime') {
      const token = session?.access_token
      if (!token || !sessionId) {
        createTriggered.current = false
        setCreateError('Unable to activate lifetime access.')
        setCreating(false)
        return
      }
      fetch('/api/stripe/activate-lifetime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      })
        .then((res) => res.json())
        .then(async (json: { ok?: boolean; error?: string }) => {
          if (json.error) throw new Error(json.error)
          await supabase.auth.refreshSession()
          router.push('/trip')
        })
        .catch((err) => {
          createTriggered.current = false
          setCreateError(
            err instanceof Error ? err.message : 'Unable to activate lifetime access.',
          )
        })
        .finally(() => setCreating(false))
      return
    }

    const stored = window.localStorage.getItem(pendingTripKey)
    if (!stored) {
      createTriggered.current = false
      setCreating(false)
      return
    }

    let payload: {
      name: string
      startDate: string | null
      endDate: string | null
    } | null = null

    try {
      payload = JSON.parse(stored)
    } catch {
      window.localStorage.removeItem(pendingTripKey)
      createTriggered.current = false
      setCreating(false)
      return
    }

    if (!payload?.name) {
      window.localStorage.removeItem(pendingTripKey)
      createTriggered.current = false
      setCreating(false)
      return
    }

    createTrip(payload.name, {
      startDate: payload.startDate,
      endDate: payload.endDate,
      stripeSessionId: sessionId,
      stripePaymentIntentId: paymentIntent,
    })
      .then(() => {
        window.localStorage.removeItem(pendingTripKey)
        router.push('/itinerary')
      })
      .catch((err) => {
        createTriggered.current = false
        setCreateError(
          err instanceof Error ? err.message : 'Unable to create trip.',
        )
      })
      .finally(() => setCreating(false))
  }, [status, user, session, router, searchParams, paymentIntent, purchaseType])

  if (authLoading) {
    return <BillingReturnLoading />
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
      <section className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
        <div className="relative grid gap-[14px] rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.92)] p-[22px] shadow-[var(--shadow-card)]">
          {error ? (
            <>
              <p className="text-lg font-semibold text-[color:var(--ink-900)]">
                We could not confirm your payment yet.
              </p>
              <p className="mt-2 text-sm text-[color:var(--ink-600)]">
                {error}
              </p>
            </>
          ) : null}

          {!error && status === 'open' ? (
            <>
              <p className="text-lg font-semibold text-[color:var(--ink-900)]">
                Your payment is still pending.
              </p>
              <p className="mt-2 text-sm text-[color:var(--ink-600)]">
                Return to checkout to finish payment.
              </p>
            </>
          ) : null}

          {!error && status === 'complete' ? (
            <>
              <p className="text-lg font-semibold text-[color:var(--ink-900)]">
                Payment complete. Your trip is unlocked.
              </p>
              <p className="mt-2 text-sm text-[color:var(--ink-600)]">
                A receipt will be sent to {email ?? 'your email'}.
              </p>
              {creating ? (
                <p className="mt-4 text-sm text-[color:var(--ink-600)]">
                  Creating your trip...
                </p>
              ) : null}
              {createError ? (
                <p className="mt-4 text-sm text-[color:var(--clay-600)]">
                  {createError}
                </p>
              ) : null}
            </>
          ) : null}

          {!error && !status ? (
            <p className="text-sm text-[color:var(--ink-600)]">
              Checking payment status...
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {status === 'complete' ? (
              <button
                type="button"
                onClick={() => router.push('/itinerary')}
                className="rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              >
                Go to itinerary
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/billing/checkout')}
                className="rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
              >
                Return to checkout
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/billing')}
              className="rounded-full border border-[color:var(--sand-300)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
            >
              Back to billing
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function BillingReturnLoading() {
  return (
    <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
      <div className="mx-auto max-w-4xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
        <p className="text-sm text-[color:var(--ink-600)]">
          Loading checkout status...
        </p>
      </div>
    </main>
  )
}

export default function BillingReturnPage() {
  return (
    <Suspense fallback={<BillingReturnLoading />}>
      <BillingReturnContent />
    </Suspense>
  )
}
