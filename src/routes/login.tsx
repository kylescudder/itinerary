import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getAuthRedirectUrl } from '../lib/authRedirect'
import { useAuth } from '../lib/auth'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [hasCode, setHasCode] = useState(false)

  useEffect(() => {
    if (loading) return
    if (session?.user) {
      navigate({ to: '/trip' })
    }
  }, [loading, navigate, session?.user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const errorParam = params.get('error')
    const errorDescription = params.get('error_description')
    if (errorParam) {
      setError(
        errorDescription ? decodeURIComponent(errorDescription) : errorParam,
      )
      return
    }
    if (!code) return
    setHasCode(true)

    const exchange = async () => {
      setWorking(true)
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        setError(exchangeError.message)
        setWorking(false)
        return
      }
      if (data?.session?.user) {
        navigate({ to: '/trip' })
        return
      }
      setWorking(false)
    }

    exchange()
  }, [])

  const handleGoogleSignIn = async () => {
    setError(null)
    setWorking(true)
    const redirectTo = getAuthRedirectUrl('/login')
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
    <main className="landing-shell login-shell">
      <section className="landing-section mx-auto max-w-4xl landing-section-inner">
        <div className="mx-auto grid w-full max-w-xl gap-6 text-center">
          <div className="grid gap-3">
            <p className="eyebrow">Secure sign in</p>
            <h1 className="font-display text-3xl text-[color:var(--ink-900)] sm:text-4xl">
              Just a moment.
            </h1>
            <p className="text-base text-[color:var(--ink-600)]">
              We are finishing the secure handoff from Google.
            </p>
          </div>
          <div className="pricing-card text-left">
            {error ? (
              <>
                <p className="rounded-2xl bg-[color:var(--sand-200)] px-4 py-3 text-sm text-[color:var(--clay-600)]">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={working}
                  className="focus-ring hero-primary w-full flex items-center justify-center gap-2"
                >
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 48 48"
                    fill="none"
                  >
                    <path
                      d="M44.5 20H24v8.5h11.8C34.6 34.2 30 37.8 24 37.8c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.5 0 6.7 1.4 9.1 3.6l6-6C35.5 5.5 30 3.4 24 3.4 12.3 3.4 2.8 12.9 2.8 24.6S12.3 45.8 24 45.8c12.6 0 20.9-8.8 20.9-21.2 0-1.4-.1-2.4-.4-3.4z"
                      fill="#FFC107"
                    />
                    <path
                      d="M6.9 14.3l6.6 4.8C15.2 15.3 19.2 12.7 24 12.7c3.5 0 6.7 1.4 9.1 3.6l6-6C35.5 5.5 30 3.4 24 3.4 15.7 3.4 8.5 8.2 6.9 14.3z"
                      fill="#FF3D00"
                    />
                    <path
                      d="M24 45.8c5.8 0 11.1-2.2 15.1-5.9l-7-5.7c-2 1.3-4.6 2.1-8.1 2.1-6 0-10.6-3.6-12.3-8.7l-6.6 5.1C8.4 40.8 15.7 45.8 24 45.8z"
                      fill="#4CAF50"
                    />
                    <path
                      d="M44.5 20H24v8.5h11.8c-.8 3.1-2.8 5.6-5.6 7.2l7 5.7c4-3.7 6.3-9.1 6.3-16.6 0-1.4-.1-2.4-.4-3.4z"
                      fill="#1976D2"
                    />
                  </svg>
                  <span>{working ? 'Connecting...' : 'Try again'}</span>
                </button>
              </>
            ) : hasCode || working ? (
              <div className="rounded-2xl border border-[color:var(--sand-300)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink-700)]">
                Completing sign-in…
              </div>
            ) : (
              <>
                <p className="text-sm text-[color:var(--ink-600)]">
                  Sign in with Google to sync your trips across devices.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={working}
                  className="focus-ring hero-primary w-full flex items-center justify-center gap-2"
                >
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 48 48"
                    fill="none"
                  >
                    <path
                      d="M44.5 20H24v8.5h11.8C34.6 34.2 30 37.8 24 37.8c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.5 0 6.7 1.4 9.1 3.6l6-6C35.5 5.5 30 3.4 24 3.4 12.3 3.4 2.8 12.9 2.8 24.6S12.3 45.8 24 45.8c12.6 0 20.9-8.8 20.9-21.2 0-1.4-.1-2.4-.4-3.4z"
                      fill="#FFC107"
                    />
                    <path
                      d="M6.9 14.3l6.6 4.8C15.2 15.3 19.2 12.7 24 12.7c3.5 0 6.7 1.4 9.1 3.6l6-6C35.5 5.5 30 3.4 24 3.4 15.7 3.4 8.5 8.2 6.9 14.3z"
                      fill="#FF3D00"
                    />
                    <path
                      d="M24 45.8c5.8 0 11.1-2.2 15.1-5.9l-7-5.7c-2 1.3-4.6 2.1-8.1 2.1-6 0-10.6-3.6-12.3-8.7l-6.6 5.1C8.4 40.8 15.7 45.8 24 45.8z"
                      fill="#4CAF50"
                    />
                    <path
                      d="M44.5 20H24v8.5h11.8c-.8 3.1-2.8 5.6-5.6 7.2l7 5.7c4-3.7 6.3-9.1 6.3-16.6 0-1.4-.1-2.4-.4-3.4z"
                      fill="#1976D2"
                    />
                  </svg>
                  <span>
                    {working ? 'Connecting...' : 'Continue with Google'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
