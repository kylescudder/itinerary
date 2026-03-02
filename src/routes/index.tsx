import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type CSSProperties } from 'react'
import { useAuth } from '../lib/auth'
import { useTrip } from '../hooks/useTrip'

export const Route = createFileRoute('/')({ component: Home })

const heroImages = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1441716844725-09cedc13a4e7?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=80',
]

function Home() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading } = useTrip()
  const [heroImage, setHeroImage] = useState(heroImages[0])
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    if (authLoading || tripLoading) return
    if (!session?.user) return
    if (trip) {
      navigate({ to: '/itinerary' })
    } else {
      navigate({ to: '/trip' })
    }
  }, [authLoading, navigate, session?.user, trip, tripLoading])

  useEffect(() => {
    const index = Math.floor(Math.random() * heroImages.length)
    setHeroImage(heroImages[index] || heroImages[0])
  }, [])

  useEffect(() => {
    const updateScroll = () => {
      setHasScrolled(window.scrollY > 12)
    }
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

  return (
    <main className="page-shell landing-shell">
      <div
        className={`landing-nav-wrap ${hasScrolled ? 'landing-nav-scrolled' : ''}`}
      >
        <nav className="landing-nav mx-auto max-w-6xl landing-nav-inner">
          <div className="landing-nav-brand">Itinerary</div>
          <div className="landing-nav-actions">
            <a href="#pricing" className="landing-nav-link">
              Pricing
            </a>
            <button
              type="button"
              onClick={() => navigate({ to: '/login' })}
              className="focus-ring landing-nav-button"
            >
              Log in
            </button>
          </div>
        </nav>
      </div>
      <section
        className="landing-hero-frame"
        style={
          heroImage
            ? ({ '--hero-image': `url(${heroImage})` } as CSSProperties)
            : undefined
        }
      >
        <div className="landing-hero-content mx-auto max-w-6xl py-12 landing-hero-inner">
          <div className="hero-copy">
            <div className="hero-word">Itinerary</div>
            <h1 className="font-display text-4xl text-[color:var(--ink-900)] sm:text-5xl">
              Build one shared plan and keep everyone moving together.
            </h1>
            <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
              Itinerary turns scattered messages into a single, living schedule
              with offline access, live updates, and one invite code for the
              whole crew.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-6xl landing-section-inner">
        <div className="flow-grid">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="font-display text-3xl text-[color:var(--ink-900)]">
              One shared plan, four quick steps.
            </h2>
            <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
              Start a trip, add the moments that matter, and keep every traveler
              in sync without chasing updates.
            </p>
          </div>
          <div className="flow-list">
            <div className="flow-row">
              <span className="step-index">01</span>
              <div>
                <p className="font-semibold text-[color:var(--ink-900)]">
                  Create a trip
                </p>
                <p className="text-sm text-[color:var(--ink-600)]">
                  Name the trip and set the dates so everyone knows the plan.
                </p>
              </div>
            </div>
            <div className="flow-row">
              <span className="step-index">02</span>
              <div>
                <p className="font-semibold text-[color:var(--ink-900)]">
                  Add itinerary moments
                </p>
                <p className="text-sm text-[color:var(--ink-600)]">
                  Drop in time, place, and notes as you discover them.
                </p>
              </div>
            </div>
            <div className="flow-row">
              <span className="step-index">03</span>
              <div>
                <p className="font-semibold text-[color:var(--ink-900)]">
                  Invite the crew
                </p>
                <p className="text-sm text-[color:var(--ink-600)]">
                  Share one code and everyone stays on the same schedule.
                </p>
              </div>
            </div>
            <div className="flow-row">
              <span className="step-index">04</span>
              <div>
                <p className="font-semibold text-[color:var(--ink-900)]">
                  Sync anywhere
                </p>
                <p className="text-sm text-[color:var(--ink-600)]">
                  Live updates + offline mode keep the plan current.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-6xl landing-section-inner">
        <div className="value-grid">
          <div className="value-item">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Why it works
            </p>
            <h3 className="font-display text-2xl text-[color:var(--ink-900)]">
              One place for every detail.
            </h3>
            <p className="text-sm text-[color:var(--ink-600)]">
              Keep times, locations, and notes together so the day stays easy to
              follow.
            </p>
          </div>
          <div className="value-item">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Sync that sticks
            </p>
            <h3 className="font-display text-2xl text-[color:var(--ink-900)]">
              Everyone sees the latest plan.
            </h3>
            <p className="text-sm text-[color:var(--ink-600)]">
              Live updates keep the group aligned, even when plans shift
              mid-trip.
            </p>
          </div>
          <div className="value-item">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Simple pricing
            </p>
            <h3 className="font-display text-2xl text-[color:var(--ink-900)]">
              Same price for every trip.
            </h3>
            <p className="text-sm text-[color:var(--ink-600)]">
              One trip, one receipt, and no subscriptions to manage.
            </p>
          </div>
        </div>
        <div className="value-actions">
          {session?.user ? (
            <button
              className="focus-ring hero-primary"
              onClick={() => navigate({ to: trip ? '/itinerary' : '/trip' })}
              type="button"
            >
              Go to your plan
            </button>
          ) : null}
        </div>
      </section>

      <section className="landing-section mx-auto max-w-6xl landing-section-inner">
        <div className="sample-grid">
          <div>
            <p className="eyebrow">Sample day</p>
            <h2 className="font-display text-3xl text-[color:var(--ink-900)]">
              A day that stays in sync.
            </h2>
            <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
              Everyone sees the same timeline, even when plans shift mid-trip.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                    Sunrise market stroll
                  </p>
                  <p className="text-xs text-[color:var(--ink-600)]">
                    7:30 AM · Gion
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--ink-600)]">
                    Meet at the shrine gate, grab breakfast on the way.
                  </p>
                </div>
                <span className="h-fit rounded-full border border-[color:var(--sand-300)] bg-white px-3 py-1.5 text-[10px] font-semibold text-[color:var(--ink-700)]">
                  Activity
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                    Tea ceremony
                  </p>
                  <p className="text-xs text-[color:var(--ink-600)]">
                    11:00 AM · Kyoto
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--ink-600)]">
                    Reservations for 4, ticket confirmation in notes.
                  </p>
                </div>
                <span className="h-fit rounded-full border border-[color:var(--sand-300)] bg-white px-3 py-1.5 text-[10px] font-semibold text-[color:var(--ink-700)]">
                  Activity
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-[color:var(--sand-300)] bg-white px-4 py-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                    Dinner at Pontocho
                  </p>
                  <p className="text-xs text-[color:var(--ink-600)]">
                    7:00 PM · Reservations
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--ink-600)]">
                    Dress code smart casual. Ask for riverside table.
                  </p>
                </div>
                <span className="h-fit rounded-full border border-[color:var(--sand-300)] bg-white px-3 py-1.5 text-[10px] font-semibold text-[color:var(--ink-700)]">
                  Meal
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="landing-section mx-auto max-w-6xl landing-section-inner"
      >
        <div className="pricing-header">
          <p className="eyebrow">Pricing</p>
          <h2 className="font-display text-3xl text-[color:var(--ink-900)]">
            Two simple ways to plan.
          </h2>
          <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
            Pay per trip or unlock unlimited trips for the year.
          </p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <p className="pricing-label">Per trip</p>
            <p className="price-value">
              $5 <span>per trip</span>
            </p>
            <p className="text-sm text-[color:var(--ink-600)]">
              Perfect for one-off getaways and quick weekends.
            </p>
            <div className="pricing-points">
              <span>Pay per trip</span>
              <span>Quick setup</span>
              <span>Group sharing</span>
              <span>Offline mode</span>
            </div>
          </div>
          <div className="pricing-card pricing-card-feature">
            <div className="pricing-chip">Unlimited</div>
            <p className="pricing-label">For life</p>
            <p className="price-value">$30</p>
            <p className="text-sm text-[color:var(--ink-600)]">
              Best for planners who travel often with different groups.
            </p>
            <div className="pricing-points">
              <span>Unlimited trips</span>
              <span>One-time price</span>
              <span>Skip trip charges</span>
              <span>All features included</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto max-w-6xl landing-section-inner">
        <div className="faq-grid">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="font-display text-3xl text-[color:var(--ink-900)]">
              Quick answers before you book.
            </h2>
            <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
              Everything you need to know about pricing, offline use, and
              receipts.
            </p>
          </div>
          <div className="faq-list">
            <div className="faq-row">
              <p className="font-semibold text-[color:var(--ink-900)]">
                What counts as a trip?
              </p>
              <p className="text-sm text-[color:var(--ink-600)]">
                Each trip you create is one plan with its own invite code and
                itinerary.
              </p>
            </div>
            <div className="faq-row">
              <p className="font-semibold text-[color:var(--ink-900)]">
                Do I pay per traveler?
              </p>
              <p className="text-sm text-[color:var(--ink-600)]">
                No. It is $5 per trip regardless of how many people you invite.
              </p>
            </div>
            <div className="faq-row">
              <p className="font-semibold text-[color:var(--ink-900)]">
                Does it work offline?
              </p>
              <p className="text-sm text-[color:var(--ink-600)]">
                Yes. Changes save locally and sync when you reconnect.
              </p>
            </div>
            <div className="faq-row">
              <p className="font-semibold text-[color:var(--ink-900)]">
                Where are receipts stored?
              </p>
              <p className="text-sm text-[color:var(--ink-600)]">
                Stripe emails your receipt and keeps invoices in the billing
                portal.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
