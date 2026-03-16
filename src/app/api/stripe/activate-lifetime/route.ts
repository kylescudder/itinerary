import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  createSupabaseAdminClient,
  requireSupabaseUser,
} from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const lifetimePriceId = process.env.STRIPE_LIFETIME_PRICE_ID

export async function POST(request: Request) {
  try {
    if (
      !stripeSecretKey ||
      !lifetimePriceId ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Missing server configuration.' },
        { status: 500 },
      )
    }

    const auth = await requireSupabaseUser(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { session_id } = (await request.json().catch(() => ({}))) as {
      session_id?: string
    }

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id.' },
        { status: 400 },
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
    })

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items'],
    })

    if (session.status !== 'complete') {
      return NextResponse.json(
        { error: 'Payment not complete.' },
        { status: 400 },
      )
    }

    const purchasedPriceId = session.line_items?.data[0]?.price?.id
    if (purchasedPriceId !== lifetimePriceId) {
      return NextResponse.json(
        { error: 'Session is not a lifetime purchase.' },
        { status: 400 },
      )
    }

    const admin = createSupabaseAdminClient()
    const { error } = await admin.auth.admin.updateUserById(auth.user.id, {
      user_metadata: { lifetime_access: true },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
