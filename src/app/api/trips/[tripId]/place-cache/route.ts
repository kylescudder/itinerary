import { NextResponse } from 'next/server'
import { requireSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: { tripId: string } },
) {
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { supabase } = auth
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim()

  if (!query) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('place_cache')
    .select('*')
    .eq('trip_id', params.tripId)
    .ilike('description', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(8)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data || [])
}

export async function POST(
  request: Request,
  { params }: { params: { tripId: string } },
) {
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { supabase } = auth
  const { entries } = (await request.json().catch(() => ({}))) as {
    entries?: Array<Record<string, unknown>>
  }

  if (!entries || !entries.length) {
    return NextResponse.json({ ok: true })
  }

  const normalized = entries.map((entry) => ({
    ...entry,
    trip_id: params.tripId,
  }))

  const { error } = await supabase
    .from('place_cache')
    .upsert(normalized, { onConflict: 'trip_id,place_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
