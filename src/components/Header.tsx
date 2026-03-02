'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/trip', label: 'Trip' },
  { to: '/itinerary', label: 'Itinerary' },
  { to: '/suggestions', label: 'Suggestions' },
  { to: '/settings', label: 'Settings' },
  { to: '/account', label: 'Account' },
  { to: '/billing', label: 'Billing' },
]

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sun-500)] focus-visible:outline-offset-[3px]'
const navLinkBase =
  'block rounded-[16px] px-4 py-3 text-[0.95rem] font-semibold transition-[transform,background,color] duration-200 ease-in-out'

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  if (!parts.length) return 'U'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

export default function Header() {
  const { session, signOut } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [avatarOk, setAvatarOk] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const avatarRef = useRef<HTMLImageElement | null>(null)
  const user = session?.user
  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'Guest'
  const avatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.avatar ||
    user?.user_metadata?.avatarUrl

  useEffect(() => {
    setAvatarOk(false)
    setAvatarFailed(false)
  }, [avatar])

  useEffect(() => {
    if (!avatar || avatarFailed) return
    const img = avatarRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setAvatarOk(true)
    }
  }, [avatar, avatarFailed])

  if (!user) {
    return null
  }

  return (
    <>
      <div
        className={`sticky top-0 z-[5] flex items-center justify-between gap-4 px-5 py-4 bg-[rgba(254,249,250,0.96)] border-b border-[rgba(234,203,213,0.6)] backdrop-blur-[12px] min-[900px]:hidden ${isOpen ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`${focusRing} rounded-[14px] border border-[rgba(234,203,213,0.8)] px-[14px] py-[10px] text-[0.85rem] font-semibold text-[color:var(--ink-700)]`}
        >
          Menu
        </button>
        <div className="flex items-center gap-3">
          <div className="h-[46px] w-[46px] rounded-[18px] bg-[radial-gradient(circle_at_top,var(--sand-50),var(--sun-400))] shadow-[0_12px_22px_rgba(240,103,124,0.35)]" />
          <div>
            <p className="[font-family:var(--font-display)] text-lg text-[color:var(--ink-900)]">
              Itinerary
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Shared planning
            </p>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[9] bg-[rgba(20,18,14,0.45)] transition-opacity duration-200 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed inset-0 left-0 right-auto z-10 w-screen flex flex-col gap-6 px-5 pb-[22px] pt-6 bg-[linear-gradient(180deg,rgba(254,249,250,0.98),rgba(248,237,240,0.96))] border-r border-[rgba(234,203,213,0.7)] shadow-[20px_0_40px_rgba(25,22,18,0.12)] transition-transform duration-[250ms] ease-in-out min-[900px]:translate-x-0 min-[900px]:w-[260px] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between gap-3 min-[900px]:justify-start">
          <div className="flex items-center gap-[14px]">
            <div className="h-[46px] w-[46px] rounded-[18px] bg-[radial-gradient(circle_at_top,var(--sand-50),var(--sun-400))] shadow-[0_12px_22px_rgba(240,103,124,0.35)]" />
            <div>
              <p className="[font-family:var(--font-display)] text-xl text-[color:var(--ink-900)]">
                Itinerary
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
                Shared planning
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={`${focusRing} rounded-[12px] border border-[rgba(234,203,213,0.8)] px-3 py-2 text-[0.8rem] font-semibold text-[color:var(--ink-700)] min-[900px]:hidden`}
          >
            Close
          </button>
        </div>
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={
                pathname === item.to
                  ? `${navLinkBase} bg-[rgba(234,203,213,0.9)] text-[color:var(--ink-900)]`
                  : `${navLinkBase} text-[color:var(--ink-700)] hover:bg-[rgba(234,203,213,0.6)] hover:text-[color:var(--ink-900)] hover:translate-x-[2px]`
              }
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {!user ? (
            <Link
              href="/login"
              className={`${navLinkBase} bg-[color:var(--sun-400)] text-[color:var(--ink-900)] hover:bg-[color:var(--sun-500)]`}
              onClick={() => setIsOpen(false)}
            >
              Sign in
            </Link>
          ) : null}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-[18px] border border-[rgba(234,203,213,0.6)] bg-[rgba(255,255,255,0.8)] px-[14px] py-3 shadow-[0_10px_18px_rgba(25,22,18,0.08)]">
            <div className="grid h-[42px] w-[42px] place-items-center overflow-hidden rounded-[14px] bg-[color:var(--sand-200)] font-bold text-[color:var(--ink-900)]">
              {avatar && !avatarFailed ? (
                <img
                  src={avatar}
                  alt={name}
                  ref={avatarRef}
                  referrerPolicy="no-referrer"
                  className={`h-full w-full object-cover transition-opacity duration-200 ease-in-out ${avatarOk ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setAvatarOk(true)}
                  onError={() => {
                    setAvatarOk(false)
                    setAvatarFailed(true)
                  }}
                />
              ) : null}
              <span className={avatarOk ? 'hidden' : ''}>
                {getInitials(name)}
              </span>
            </div>
            <div className="flex flex-col gap-[2px]">
              <p className="text-[0.95rem] font-semibold text-[color:var(--ink-900)]">
                {name}
              </p>
              <p className="text-[0.75rem] text-[color:var(--ink-600)]">
                {user ? 'Signed in with Google' : 'Not signed in'}
              </p>
            </div>
          </div>
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-[14px] border border-[rgba(234,203,213,0.8)] px-[14px] py-[10px] text-[0.85rem] font-semibold text-[color:var(--ink-700)] transition-[border,color] duration-200 ease-in-out hover:border-[color:var(--sun-400)] hover:text-[color:var(--ink-900)]"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </aside>
    </>
  )
}
