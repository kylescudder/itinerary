import { NextResponse } from 'next/server'
import { requireSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { supabase, user } = auth
  const { code } = (await request.json().catch(() => ({}))) as {
    code?: string
  }

  if (!code || !code.trim()) {
    return NextResponse.json(
      { error: 'Invite code is required.' },
      { status: 400 },
    )
  }

  const { data: trip, error: tripError } = await supabase
    .from('trip')
    .select('*')
    .eq('code', code.trim())
    .maybeSingle()

  if (tripError) {
    return NextResponse.json({ error: tripError.message }, { status: 400 })
  }

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
  }

  const { error: memberError } = await supabase
    .from('trip_members')
    .upsert(
      { trip_id: trip.id, user_id: user.id, role: 'member' },
      { onConflict: 'trip_id,user_id' },
    )

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 })
  }

  return NextResponse.json(trip)
}
