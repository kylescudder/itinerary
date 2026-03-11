import { NextResponse } from 'next/server'
import { generateTripCode } from '@/lib/utils'
import { requireSupabaseUser, createSupabaseAdminClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { user } = auth
  const admin = createSupabaseAdminClient()

  const { data: members, error: membersError } = await admin
    .from('trip_members')
    .select('trip_id, role')
    .eq('user_id', user.id)

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 400 })
  }

  const tripIds = (members || []).map((m) => m.trip_id)

  if (!tripIds.length) {
    return NextResponse.json([])
  }

  const { data: tripsData, error: tripsError } = await admin
    .from('trip')
    .select('*')
    .in('id', tripIds)
    .order('created_at', { ascending: false })

  if (tripsError) {
    return NextResponse.json({ error: tripsError.message }, { status: 400 })
  }

  const roleByTripId = Object.fromEntries(
    (members || []).map((m) => [m.trip_id, m.role]),
  )

  const trips = (tripsData || []).map((trip) => ({
    ...trip,
    user_role: roleByTripId[trip.id] ?? 'member',
  }))

  return NextResponse.json(trips)
}

export async function POST(request: Request) {
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { user } = auth
  const admin = createSupabaseAdminClient()
  const { name, start_date, end_date, stripe_session_id, stripe_payment_intent_id } = (await request
    .json()
    .catch(() => ({}))) as {
    name?: string
    start_date?: string | null
    end_date?: string | null
    stripe_session_id?: string | null
    stripe_payment_intent_id?: string | null
  }

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: 'Trip name is required.' },
      { status: 400 },
    )
  }

  let created: Record<string, unknown> | null = null
  let lastError: string | null = null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = crypto.randomUUID()
    const code = generateTripCode()
    const { error } = await admin.from('trip').insert({
      id,
      name: name.trim(),
      code,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      stripe_session_id: stripe_session_id ?? null,
      stripe_payment_intent_id: stripe_payment_intent_id ?? null,
    })

    if (error) {
      lastError = error.message
      continue
    }

    const { error: memberError } = await admin
      .from('trip_members')
      .insert({ trip_id: id, user_id: user.id, role: 'owner' })

    if (memberError) {
      lastError = memberError.message
      continue
    }

    const { data: trip, error: fetchError } = await admin
      .from('trip')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      lastError = fetchError.message
      continue
    }

    if (trip) {
      created = trip
      break
    }
  }

  if (!created) {
    return NextResponse.json(
      { error: lastError || 'Unable to create trip.' },
      { status: 400 },
    )
  }

  return NextResponse.json(created)
}
