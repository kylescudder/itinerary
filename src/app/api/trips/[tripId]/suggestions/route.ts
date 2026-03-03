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
  const { data, error } = await supabase
    .from('place_suggestion')
    .select('*')
    .eq('trip_id', params.tripId)
    .order('created_at', { ascending: false })

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
  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null

  if (!payload) {
    return NextResponse.json({ error: 'Missing payload.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('place_suggestion')
    .insert({ ...payload, trip_id: params.tripId })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
