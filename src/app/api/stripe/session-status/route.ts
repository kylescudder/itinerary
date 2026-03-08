import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export async function GET(request: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Missing Stripe configuration.' },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id.' }, { status: 400 })
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2026-02-25.clover',
  })

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  return NextResponse.json({
    status: session.status,
    customer_email: session.customer_details?.email || session.customer_email,
    payment_intent:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    purchase_type: (session.metadata?.purchase_type ?? 'trip') as 'trip' | 'lifetime',
  })
}
