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
      <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
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
    <main className="min-h-screen px-[clamp(20px,5vw,64px)] pt-8 pb-[60px]">
      <section className="mx-auto max-w-5xl rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[linear-gradient(135deg,rgba(248,237,240,0.9),rgba(254,249,250,0.95))] px-8 py-12 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Billing
            </p>
            <h1 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
              Simple billing, $5 per trip.
            </h1>
          </div>
          <span className="self-start rounded-full border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.9)] px-3 py-[6px] text-[0.7rem] uppercase tracking-[0.2em] text-[color:var(--ink-700)]">
            Powered by Stripe
          </span>
        </div>

        <div className="grid gap-[18px]">
          <div className="rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.92)] p-[22px] shadow-[var(--shadow-card)]">
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
              className="mt-5 rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
            >
              Continue to checkout
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
