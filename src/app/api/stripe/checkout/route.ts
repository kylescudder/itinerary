import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const tripPriceId = process.env.STRIPE_TRIP_PRICE_ID
const lifetimePriceId = process.env.STRIPE_LIFETIME_PRICE_ID

const resolveSiteUrl = () => {
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (publicUrl) return publicUrl
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.URL) return process.env.URL
  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  if (!stripeSecretKey || !tripPriceId) {
    return NextResponse.json(
      { error: 'Missing Stripe configuration.' },
      { status: 500 },
    )
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2026-02-25.clover',
  })

  const { email, type } = (await request.json().catch(() => ({}))) as {
    email?: string | null
    type?: 'trip' | 'lifetime'
  }

  const isLifetime = type === 'lifetime'
  const selectedPriceId = isLifetime ? lifetimePriceId : tripPriceId

  if (!selectedPriceId) {
    return NextResponse.json(
      { error: isLifetime ? 'Lifetime price not configured.' : 'Missing Stripe configuration.' },
      { status: 500 },
    )
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'payment',
    customer_email: email || undefined,
    line_items: [{ price: selectedPriceId, quantity: 1 }],
    metadata: { purchase_type: isLifetime ? 'lifetime' : 'trip' },
    return_url: `${resolveSiteUrl()}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
  })

  return NextResponse.json({ clientSecret: session.client_secret })
}
