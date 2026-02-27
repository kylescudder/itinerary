import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (loading) return
    if (session?.user) {
      navigate({ to: '/trip' })
    }
  }, [loading, navigate, session?.user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    const exchange = async () => {
      setWorking(true)
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        setError(exchangeError.message)
      }
      setWorking(false)
    }

    exchange()
  }, [])

  const handleGoogleSignIn = async () => {
    setError(null)
    setWorking(true)
    const redirectTo = `${window.location.origin}/login`
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (authError) {
      setError(authError.message)
      setWorking(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="section-shell mx-auto grid max-w-3xl gap-6 px-8 py-12 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
            Signing you in
          </p>
          <h1 className="font-display text-3xl text-[color:var(--ink-900)]">
            Just a moment.
          </h1>
          <p className="mt-3 text-sm text-[color:var(--ink-600)]">
            We are finishing the secure handoff from Google.
          </p>
        </div>
        {error ? (
          <div className="glass-panel rounded-3xl p-6 text-left">
            <p className="mb-4 rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--clay-600)]">
              {error}
            </p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={working}
              className="focus-ring w-full rounded-2xl bg-[color:var(--sun-400)] px-5 py-3 text-sm font-semibold text-[color:var(--ink-900)] shadow"
            >
              {working ? 'Connecting...' : 'Try again'}
            </button>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-sm text-[color:var(--ink-700)]">Completing sign-in…</p>
          </div>
        )}
      </section>
    </main>
  )
}
