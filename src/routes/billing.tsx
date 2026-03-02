import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  createStripeCheckoutSession,
  createStripePortalSession,
} from '../lib/billing'

export const Route = createFileRoute('/billing')({ component: Billing })

function Billing() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const user = session?.user

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate({ to: '/' })
    }
  }, [authLoading, navigate, user])

  const handlePortal = async () => {
    setMessage(null)
    setPortalLoading(true)
    try {
      const url = await createStripePortalSession()
      window.location.assign(url)
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Unable to open Stripe portal.',
      )
    } finally {
      setPortalLoading(false)
    }
  }

  const handleCheckout = async () => {
    setMessage(null)
    setCheckoutLoading(true)
    try {
      const url = await createStripeCheckoutSession()
      window.location.assign(url)
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Unable to start billing.',
      )
    } finally {
      setCheckoutLoading(false)
    }
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
              Payment method
            </p>
            <p className="mt-4 text-lg font-semibold text-[color:var(--ink-900)]">
              Add or update a card
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-600)]">
              We charge a flat $5 per trip. No subscriptions, no surprise
              renewals.
            </p>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="focus-ring mt-5 rounded-full bg-[color:var(--sun-400)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-900)]"
            >
              {checkoutLoading ? 'Opening Stripe...' : 'Add payment method'}
            </button>
          </div>

          <div className="billing-card">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Billing portal
            </p>
            <p className="mt-4 text-lg font-semibold text-[color:var(--ink-900)]">
              Manage invoices and receipts
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-600)]">
              Stripe hosts your invoices, tax info, and payment history in one
              secure place.
            </p>
            <button
              type="button"
              onClick={handlePortal}
              disabled={portalLoading}
              className="focus-ring mt-5 rounded-full border border-[color:var(--sand-300)] px-6 py-3 text-sm font-semibold text-[color:var(--ink-700)]"
            >
              {portalLoading ? 'Opening portal...' : 'Open Stripe portal'}
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

        {message ? (
          <p className="mt-6 rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--clay-600)]">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  )
}
