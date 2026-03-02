import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const priceId = process.env.STRIPE_PRICE_ID

const resolveSiteUrl = () => {
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (publicUrl) return publicUrl
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.URL) return process.env.URL
  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  if (!stripeSecretKey || !priceId) {
    return NextResponse.json(
      { error: 'Missing Stripe configuration.' },
      { status: 500 },
    )
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2026-02-25.clover',
  })

  const { email } = (await request.json().catch(() => ({}))) as {
    email?: string | null
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'payment',
    customer_email: email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${resolveSiteUrl()}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
  })

  return NextResponse.json({ clientSecret: session.client_secret })
}
