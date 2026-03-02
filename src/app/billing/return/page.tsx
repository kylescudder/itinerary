'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchStripeSessionStatus } from '../../../lib/billing'
import { useAuth } from '../../../lib/auth'

export default function BillingReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, loading: authLoading } = useAuth()
  const [status, setStatus] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const user = session?.user

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
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load status.')
      })
  }, [searchParams])

  if (authLoading) {
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
