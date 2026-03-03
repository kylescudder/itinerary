import { NextResponse } from 'next/server'
import { requireSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  { params }: { params: { tripId: string } },
) {
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { supabase } = auth
  const { updates } = (await request.json().catch(() => ({}))) as {
    updates?: {
      name?: string
      start_date?: string | null
      end_date?: string | null
    }
  }

  if (!updates) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const payload: Record<string, string | null> = {}
  if (updates.name !== undefined) payload.name = updates.name
  if (updates.start_date !== undefined) payload.start_date = updates.start_date
  if (updates.end_date !== undefined) payload.end_date = updates.end_date

  if (!Object.keys(payload).length) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('trip')
    .update(payload)
    .eq('id', params.tripId)
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
  }

  return NextResponse.json(data)
}
