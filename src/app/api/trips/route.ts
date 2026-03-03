import { NextResponse } from 'next/server'
import { generateTripCode } from '@/lib/utils'
import { requireSupabaseUser } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { supabase } = auth
  const { data, error } = await supabase
    .from('trip')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const auth = await requireSupabaseUser(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const { supabase, user } = auth
  const { name, start_date, end_date } = (await request
    .json()
    .catch(() => ({}))) as {
    name?: string
    start_date?: string | null
    end_date?: string | null
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
    const { error } = await supabase.from('trip').insert({
      id,
      name: name.trim(),
      code,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
    })

    if (error) {
      lastError = error.message
      continue
    }

    const { error: memberError } = await supabase
      .from('trip_members')
      .insert({ trip_id: id, user_id: user.id, role: 'owner' })

    if (memberError) {
      lastError = memberError.message
      continue
    }

    const { data: trip, error: fetchError } = await supabase
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
