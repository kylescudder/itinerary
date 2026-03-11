import { NextResponse } from 'next/server'
import { requireSupabaseUser, createSupabaseAdminClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

type RouteParams = { tripId: string }
type RouteContext = { params: Promise<RouteParams> }

export async function PATCH(request: Request, context: RouteContext) {
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

  const { data, error } = await admin
    .from('trip')
    .update(payload)
    .eq('id', tripId)
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
