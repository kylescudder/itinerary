import { NextResponse } from 'next/server'
import { requireSupabaseUser, createSupabaseAdminClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

type RouteParams = { itemId: string }
type RouteContext = { params: Promise<RouteParams> }

export async function PATCH(request: Request, context: RouteContext) {
  const { itemId } = await context.params
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { user } = auth
  const admin = createSupabaseAdminClient()

  const { updates } = (await request.json().catch(() => ({}))) as {
    updates?: Record<string, unknown>
  }

  if (!updates || !Object.keys(updates).length) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  // Get the user's trip memberships to enforce authorization
  const { data: memberships } = await admin
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user.id)

  const tripIds = (memberships || []).map((m) => m.trip_id)

  if (!tripIds.length) {
    return NextResponse.json({ error: 'Itinerary item not found.' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('itinerary_item')
    .update(updates)
    .eq('id', itemId)
    .in('trip_id', tripIds)
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Itinerary item not found.' },
      { status: 404 },
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, context: RouteContext) {
  const { itemId } = await context.params
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { user } = auth
  const admin = createSupabaseAdminClient()

  // Get the user's trip memberships to enforce authorization
  const { data: memberships } = await admin
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', user.id)

  const tripIds = (memberships || []).map((m) => m.trip_id)

  if (!tripIds.length) {
    return NextResponse.json({ tripId: null })
  }

  const { data, error } = await admin
    .from('itinerary_item')
    .delete()
    .eq('id', itemId)
    .in('trip_id', tripIds)
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ tripId: data?.trip_id || null })
}
