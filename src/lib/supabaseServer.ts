import { createClient, type User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function readAccessToken(request: Request) {
  const header = request.headers.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null
  return token.trim()
}

export function createSupabaseServerClient(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration.')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin configuration.')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function requireSupabaseUser(request: Request) {
  const token = readAccessToken(request)
  if (!token) {
    return { error: 'Missing authentication token.' }
  }

  const supabase = createSupabaseServerClient(token)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { error: 'Invalid session.' }
  }

  return { supabase, user: data.user as User }
}
