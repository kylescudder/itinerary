'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type CSSProperties } from 'react'
import { useAuth } from '../lib/auth'
import { useTrip } from '../hooks/useTrip'

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

export default function HomePage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const { trip, loading: tripLoading } = useTrip()
  const [heroImage, setHeroImage] = useState(heroImages[0])
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!session?.user) return
    // Try to redirect immediately using localStorage before trip API loads
    const storedTripId =
      typeof window !== 'undefined'
        ? localStorage.getItem('itinerary:active-trip-id')
        : null
    if (storedTripId) {
      router.replace('/itinerary')
      return
    }
    if (!tripLoading) {
      router.replace(trip ? '/itinerary' : '/trip')
    }
  }, [authLoading, router, session?.user, trip, tripLoading])

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

  // While auth is loading or user is logged in (redirect pending), show minimal placeholder
  if (authLoading || session?.user) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fbecef_0%,#f6eef2_45%,#f8f3f2_100%)]" />
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbecef_0%,#f6eef2_45%,#f8f3f2_100%)]">
      <div
        className={`fixed top-0 left-0 right-0 z-[5] py-[18px] border-b border-transparent transition-[background,border-color,backdrop-filter] duration-[400ms] ease-in-out ${hasScrolled ? 'bg-[rgba(248,236,239,0.85)] backdrop-blur-[10px] border-[rgba(234,203,213,0.5)]' : 'bg-transparent backdrop-blur-0'}`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-[clamp(22px,7vw,48px)] max-[640px]:px-6">
          <div
            className={`text-[0.85rem] font-bold uppercase tracking-[0.3em] text-[color:var(--ink-800)] transition-opacity duration-[400ms] ease-in-out ${hasScrolled ? 'opacity-100' : 'opacity-0'}`}
          >
            Itinerary
          </div>
          <div className="flex items-center gap-[14px]">
            <a
              href="#pricing"
              className="text-[0.85rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-700)]"
            >
              Pricing
            </a>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="rounded-full border border-[rgba(58,55,50,0.35)] bg-[rgba(254,249,250,0.85)] px-4 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
            >
              Log in
            </button>
          </div>
        </nav>
      </div>
      <section
        className="relative isolate overflow-hidden bg-[#f6e9ec] pb-2 min-[900px]:pt-[96px] min-[900px]:pb-[96px] before:absolute before:inset-0 before:z-0 before:bg-[image:var(--hero-image)] before:bg-cover before:bg-center after:absolute after:inset-0 after:z-[1] after:bg-[linear-gradient(120deg,rgba(248,236,239,0.96),rgba(246,237,240,0.82)),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.7),transparent_55%)]"
        style={
          heroImage
            ? ({ '--hero-image': `url(${heroImage})` } as CSSProperties)
            : undefined
        }
      >
        <div className="relative z-[2] mx-auto grid max-w-6xl gap-6 px-[clamp(22px,7vw,48px)] py-12 pt-[120px] max-[640px]:px-6">
          <div className="flex flex-col gap-[18px]">
            <div className="[font-family:var(--font-display)] text-[clamp(2.8rem,6.5vw,5.6rem)] font-bold tracking-[-0.02em] text-[color:var(--ink-900)]">
              Itinerary
            </div>
            <h1 className="[font-family:var(--font-display)] text-4xl text-[color:var(--ink-900)] sm:text-5xl">
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

      <section className="mx-auto grid max-w-6xl gap-5 px-[clamp(22px,7vw,48px)] py-[72px] max-[640px]:px-6 max-[640px]:py-12">
        <div className="grid gap-5 min-[900px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] min-[900px]:items-start">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              How it works
            </p>
            <h2 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
              One shared plan, four quick steps.
            </h2>
            <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
              Start a trip, add the moments that matter, and keep every traveler
              in sync without chasing updates.
            </p>
          </div>
          <div className="grid gap-0 pt-3">
            <div className="grid grid-cols-[auto_1fr] items-start gap-4 border-b border-[rgba(234,203,213,0.7)] py-4 last:border-b-0">
              <span className="rounded-full border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.9)] px-3 py-[6px] text-[0.8rem] font-bold tracking-[0.2em] text-[color:var(--ink-700)]">
                01
              </span>
              <div>
                <p className="font-semibold text-[color:var(--ink-900)]">
                  Create a trip
                </p>
                <p className="text-sm text-[color:var(--ink-600)]">
                  Name the trip and set the dates so everyone knows the plan.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-start gap-4 border-b border-[rgba(234,203,213,0.7)] py-4 last:border-b-0">
              <span className="rounded-full border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.9)] px-3 py-[6px] text-[0.8rem] font-bold tracking-[0.2em] text-[color:var(--ink-700)]">
                02
              </span>
              <div>
                <p className="font-semibold text-[color:var(--ink-900)]">
                  Add itinerary moments
                </p>
                <p className="text-sm text-[color:var(--ink-600)]">
                  Drop in time, place, and notes as you discover them.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-start gap-4 border-b border-[rgba(234,203,213,0.7)] py-4 last:border-b-0">
              <span className="rounded-full border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.9)] px-3 py-[6px] text-[0.8rem] font-bold tracking-[0.2em] text-[color:var(--ink-700)]">
                03
              </span>
              <div>
                <p className="font-semibold text-[color:var(--ink-900)]">
                  Invite the crew
                </p>
                <p className="text-sm text-[color:var(--ink-600)]">
                  Share one code and everyone stays on the same schedule.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-start gap-4 border-b border-[rgba(234,203,213,0.7)] py-4 last:border-b-0">
              <span className="rounded-full border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.9)] px-3 py-[6px] text-[0.8rem] font-bold tracking-[0.2em] text-[color:var(--ink-700)]">
                04
              </span>
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

      <section className="mx-auto grid max-w-6xl gap-5 border-t border-[rgba(234,203,213,0.7)] px-[clamp(22px,7vw,48px)] py-[72px] max-[640px]:px-6 max-[640px]:py-12 max-[640px]:pt-10">
        <div className="grid gap-0 min-[900px]:grid-cols-[repeat(3,minmax(0,1fr))] min-[900px]:gap-[18px]">
          <div className="grid gap-[10px] border-b border-[rgba(234,203,213,0.7)] py-5 last:border-b-0 min-[900px]:border-b-0 min-[900px]:p-0">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Why it works
            </p>
            <h3 className="[font-family:var(--font-display)] text-2xl text-[color:var(--ink-900)]">
              One place for every detail.
            </h3>
            <p className="text-sm text-[color:var(--ink-600)]">
              Keep times, locations, and notes together so the day stays easy to
              follow.
            </p>
          </div>
          <div className="grid gap-[10px] border-b border-[rgba(234,203,213,0.7)] py-5 last:border-b-0 min-[900px]:border-b-0 min-[900px]:p-0">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Sync that sticks
            </p>
            <h3 className="[font-family:var(--font-display)] text-2xl text-[color:var(--ink-900)]">
              Everyone sees the latest plan.
            </h3>
            <p className="text-sm text-[color:var(--ink-600)]">
              Live updates keep the group aligned, even when plans shift
              mid-trip.
            </p>
          </div>
          <div className="grid gap-[10px] border-b border-[rgba(234,203,213,0.7)] py-5 last:border-b-0 min-[900px]:border-b-0 min-[900px]:p-0">
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Simple pricing
            </p>
            <h3 className="[font-family:var(--font-display)] text-2xl text-[color:var(--ink-900)]">
              Same price for every trip.
            </h3>
            <p className="text-sm text-[color:var(--ink-600)]">
              One trip, one receipt, and no subscriptions to manage.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="rounded-full bg-[color:var(--ink-900)] px-[22px] py-3 text-[0.9rem] font-bold tracking-[0.02em] text-[color:var(--sand-50)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]"
          >
            Get started
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 border-t border-[rgba(234,203,213,0.7)] px-[clamp(22px,7vw,48px)] py-[72px] max-[640px]:px-6 max-[640px]:py-12 max-[640px]:pt-10">
        <div className="grid gap-6 min-[900px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] min-[900px]:items-start">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              Sample day
            </p>
            <h2 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
              A day that stays in sync.
            </h2>
            <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
              Everyone sees the same timeline, even when plans shift mid-trip.
            </p>
          </div>
          <div className="grid gap-[14px] rounded-[28px] border border-[rgba(206,189,198,0.7)] bg-[linear-gradient(180deg,#e8e6ec_0%,#dedbe3_100%)] p-5 shadow-[var(--shadow-card)]">
            <p className="text-[0.7rem] uppercase tracking-[0.4em] text-[rgba(66,62,57,0.7)]">
              Tue, Mar 17
            </p>
            <div className="grid gap-3 rounded-[24px] border border-[rgba(186,163,175,0.7)] bg-[rgba(223,226,233,0.92)] p-4">
              <div>
                <p className="text-[1.05rem] font-semibold text-[#2f2d2a]">
                  Narita International Airport
                </p>
                <p className="text-[0.85rem] text-[rgba(63,59,55,0.7)]">
                  9:05 PM · travel · From · Car
                </p>
              </div>
              <div className="grid gap-[10px]">
                <button
                  type="button"
                  className="rounded-full border border-[rgba(186,163,175,0.9)] bg-[rgba(226,229,236,0.95)] px-[14px] py-[10px] text-[0.85rem] font-semibold text-[rgba(71,67,63,0.9)]"
                >
                  Done
                </button>
                <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-full border border-[rgba(186,163,175,0.8)] bg-[rgba(220,217,227,0.9)]">
                  <button
                    type="button"
                    className="rounded-none border-0 border-r border-[rgba(186,163,175,0.8)] bg-transparent px-[14px] py-[10px] text-[0.85rem] font-semibold text-[rgba(71,67,63,0.9)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-none border-0 border-r-0 bg-transparent px-[14px] py-[10px] text-[0.85rem] font-semibold text-[rgba(143,95,106,0.9)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-full border border-dashed border-[rgba(186,163,175,0.75)] bg-[rgba(224,222,230,0.85)] px-4 py-3 text-[0.85rem] text-[rgba(67,62,58,0.75)]">
              Travel 44.9 mi · 1 hour 4 mins · Car
            </div>
            <div className="grid gap-3 rounded-[24px] border border-[rgba(186,163,175,0.7)] bg-[rgba(223,226,233,0.92)] p-4">
              <div>
                <p className="text-[1.05rem] font-semibold text-[#2f2d2a]">
                  Oku Station
                </p>
                <p className="text-[0.85rem] text-[rgba(63,59,55,0.7)]">
                  9:05 PM · travel · To · Car
                </p>
              </div>
              <div className="grid gap-[10px]">
                <button
                  type="button"
                  className="rounded-full border border-[rgba(186,163,175,0.9)] bg-[rgba(226,229,236,0.95)] px-[14px] py-[10px] text-[0.85rem] font-semibold text-[rgba(71,67,63,0.9)]"
                >
                  Done
                </button>
              </div>
            </div>
            <div className="rounded-full border border-dashed border-[rgba(186,163,175,0.75)] bg-[rgba(224,222,230,0.85)] px-4 py-3 text-[0.85rem] text-[rgba(67,62,58,0.75)]">
              Travel 0.4 mi · 8 mins · Walk
            </div>
            <div className="grid gap-3 rounded-[24px] border border-[rgba(186,163,175,0.7)] bg-[rgba(223,226,233,0.92)] p-4">
              <div>
                <p className="text-[1.05rem] font-semibold text-[#2f2d2a]">
                  Tsutsujigaoka Park
                </p>
                <p className="text-[0.85rem] text-[rgba(63,59,55,0.7)]">
                  10:30 PM · stay
                </p>
                <p className="mt-[6px] text-[0.85rem] text-[rgba(63,59,55,0.8)]">
                  Open 24 hours
                </p>
              </div>
              <div className="grid gap-[10px]">
                <button
                  type="button"
                  className="rounded-full border border-[rgba(186,163,175,0.9)] bg-[rgba(226,229,236,0.95)] px-[14px] py-[10px] text-[0.85rem] font-semibold text-[rgba(71,67,63,0.9)]"
                >
                  Done
                </button>
                <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-full border border-[rgba(186,163,175,0.8)] bg-[rgba(220,217,227,0.9)]">
                  <button
                    type="button"
                    className="rounded-none border-0 border-r border-[rgba(186,163,175,0.8)] bg-transparent px-[14px] py-[10px] text-[0.85rem] font-semibold text-[rgba(71,67,63,0.9)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-none border-0 border-r-0 bg-transparent px-[14px] py-[10px] text-[0.85rem] font-semibold text-[rgba(143,95,106,0.9)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="mx-auto grid max-w-6xl gap-5 border-t border-[rgba(234,203,213,0.7)] px-[clamp(22px,7vw,48px)] py-[72px] max-[640px]:px-6 max-[640px]:py-12 max-[640px]:pt-10"
      >
        <div className="grid gap-3 pt-3 pb-2">
          <p className="text-[0.7rem] uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
            Pricing
          </p>
          <h2 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
            Two simple ways to plan.
          </h2>
          <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
            Pay per trip or unlock unlimited trips for the year.
          </p>
        </div>
        <div className="mt-5 grid gap-4 min-[900px]:grid-cols-[repeat(2,minmax(0,1fr))] min-[900px]:items-stretch min-[900px]:gap-6">
          <div className="relative grid gap-[14px] rounded-[24px] border border-[rgba(234,203,213,0.7)] bg-[rgba(254,249,250,0.92)] p-[22px] shadow-[var(--shadow-card)]">
            <p className="text-[0.75rem] uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Per trip
            </p>
            <p className="text-[clamp(2rem,3vw,2.6rem)] font-semibold text-[color:var(--ink-900)]">
              $5{' '}
              <span className="text-base font-medium text-[color:var(--ink-600)]">
                per trip
              </span>
            </p>
            <p className="text-sm text-[color:var(--ink-600)]">
              Perfect for one-off getaways and quick weekends.
            </p>
            <div className="grid gap-2 text-[0.9rem] text-[color:var(--ink-700)]">
              <span className="inline-flex items-center gap-2 before:content-['•'] before:text-[color:var(--clay-500)]">
                Pay per trip
              </span>
              <span className="inline-flex items-center gap-2 before:content-['•'] before:text-[color:var(--clay-500)]">
                Quick setup
              </span>
              <span className="inline-flex items-center gap-2 before:content-['•'] before:text-[color:var(--clay-500)]">
                Group sharing
              </span>
              <span className="inline-flex items-center gap-2 before:content-['•'] before:text-[color:var(--clay-500)]">
                Offline mode
              </span>
            </div>
          </div>
          <div className="relative grid gap-[14px] rounded-[24px] border border-[rgba(146,97,107,0.5)] bg-[rgba(255,255,255,0.92)] p-[22px] shadow-[var(--shadow-card)]">
            <div className="absolute top-4 right-4 rounded-full border border-[rgba(146,97,107,0.4)] bg-[rgba(254,249,250,0.9)] px-3 py-[6px] text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-700)]">
              Unlimited
            </div>
            <p className="text-[0.75rem] uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              For life
            </p>
            <p className="text-[clamp(2rem,3vw,2.6rem)] font-semibold text-[color:var(--ink-900)]">
              $30
            </p>
            <p className="text-sm text-[color:var(--ink-600)]">
              Best for planners who travel often with different groups.
            </p>
            <div className="grid gap-2 text-[0.9rem] text-[color:var(--ink-700)]">
              <span className="inline-flex items-center gap-2 before:content-['•'] before:text-[color:var(--clay-500)]">
                Unlimited trips
              </span>
              <span className="inline-flex items-center gap-2 before:content-['•'] before:text-[color:var(--clay-500)]">
                One-time price
              </span>
              <span className="inline-flex items-center gap-2 before:content-['•'] before:text-[color:var(--clay-500)]">
                Skip trip charges
              </span>
              <span className="inline-flex items-center gap-2 before:content-['•'] before:text-[color:var(--clay-500)]">
                All features included
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 border-t border-[rgba(234,203,213,0.7)] px-[clamp(22px,7vw,48px)] py-[72px] max-[640px]:px-6 max-[640px]:py-12 max-[640px]:pt-10">
        <div className="grid gap-5 min-[900px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] min-[900px]:items-start">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.35em] text-[color:var(--ink-600)]">
              FAQ
            </p>
            <h2 className="[font-family:var(--font-display)] text-3xl text-[color:var(--ink-900)]">
              Quick answers before you book.
            </h2>
            <p className="text-base leading-relaxed text-[color:var(--ink-600)]">
              Everything you need to know about pricing, offline use, and
              receipts.
            </p>
          </div>
          <div className="grid gap-0 min-[900px]:grid-cols-[repeat(2,minmax(0,1fr))] min-[900px]:gap-3">
            <div className="grid gap-[6px] border-b border-[rgba(234,203,213,0.7)] py-4 last:border-b-0 min-[900px]:border-b-0 min-[900px]:p-0">
              <p className="font-semibold text-[color:var(--ink-900)]">
                What counts as a trip?
              </p>
              <p className="text-sm text-[color:var(--ink-600)]">
                Each trip you create is one plan with its own invite code and
                itinerary.
              </p>
            </div>
            <div className="grid gap-[6px] border-b border-[rgba(234,203,213,0.7)] py-4 last:border-b-0 min-[900px]:border-b-0 min-[900px]:p-0">
              <p className="font-semibold text-[color:var(--ink-900)]">
                Do I pay per traveler?
              </p>
              <p className="text-sm text-[color:var(--ink-600)]">
                No. It is $5 per trip regardless of how many people you invite.
              </p>
            </div>
            <div className="grid gap-[6px] border-b border-[rgba(234,203,213,0.7)] py-4 last:border-b-0 min-[900px]:border-b-0 min-[900px]:p-0">
              <p className="font-semibold text-[color:var(--ink-900)]">
                Does it work offline?
              </p>
              <p className="text-sm text-[color:var(--ink-600)]">
                Yes. Changes save locally and sync when you reconnect.
              </p>
            </div>
            <div className="grid gap-[6px] border-b border-[rgba(234,203,213,0.7)] py-4 last:border-b-0 min-[900px]:border-b-0 min-[900px]:p-0">
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
