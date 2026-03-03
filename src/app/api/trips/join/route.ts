import { NextResponse } from 'next/server'
import { requireSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { supabase } = auth
  const { code } = (await request.json().catch(() => ({}))) as {
    code?: string
  }

  if (!code || !code.trim()) {
    return NextResponse.json(
      { error: 'Invite code is required.' },
      { status: 400 },
    )
  }

  const { data: trip, error } = await supabase.rpc('join_trip', {
    invite_code: code.trim(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
  }

  return NextResponse.json(trip)
}
