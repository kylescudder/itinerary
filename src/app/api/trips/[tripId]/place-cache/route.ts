import { NextResponse } from 'next/server'
import { requireSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

type RouteParams = { tripId: string }
type RouteContext = { params: Promise<RouteParams> }

export async function GET(request: Request, context: RouteContext) {
  const { tripId } = await context.params
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { supabase, user } = auth

  const { data: member } = await supabase
    .from('trip_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('trip_id', tripId)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim()

  if (!query) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('place_cache')
    .select('*')
    .eq('trip_id', tripId)
    .ilike('description', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(8)

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

  const { supabase, user } = auth

  const { data: member } = await supabase
    .from('trip_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('trip_id', tripId)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
  }

  const { entries } = (await request.json().catch(() => ({}))) as {
    entries?: Array<Record<string, unknown>>
  }

  if (!entries || !entries.length) {
    return NextResponse.json({ ok: true })
  }

  const normalized = entries.map((entry) => ({
    ...entry,
    trip_id: tripId,
  }))

  const { error } = await supabase
    .from('place_cache')
    .upsert(normalized, { onConflict: 'trip_id,place_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
