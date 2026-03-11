import { NextResponse } from 'next/server'
import { requireSupabaseUser, createSupabaseAdminClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

type RouteParams = { tripId: string }
type RouteContext = { params: Promise<RouteParams> }

export async function GET(request: Request, context: RouteContext) {
  const { tripId } = await context.params
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { user } = auth
  const admin = createSupabaseAdminClient()

  const { data: member } = await admin
    .from('trip_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('trip_id', tripId)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('itinerary_item')
    .select('*')
    .eq('trip_id', tripId)
    .order('start_time', { ascending: true, nullsFirst: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data || [])
}

export async function POST(request: Request, context: RouteContext) {
  const { tripId } = await context.params
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { user } = auth
  const admin = createSupabaseAdminClient()

  const { data: member } = await admin
    .from('trip_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('trip_id', tripId)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
  }

  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null

  if (!payload) {
    return NextResponse.json({ error: 'Missing payload.' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('itinerary_item')
    .insert({ ...payload, trip_id: tripId })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
