import { Link, useRouterState } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import { useState } from 'react'

const navItems = [
  { to: '/trip', label: 'Trip' },
  { to: '/itinerary', label: 'Itinerary' },
  { to: '/suggestions', label: 'Suggestions' },
  { to: '/settings', label: 'Settings' },
]

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  if (!parts.length) return 'U'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${last}`.toUpperCase()
}

export default function Header() {
  const { session, signOut } = useAuth()
  const location = useRouterState({ select: (state) => state.location })
  const [isOpen, setIsOpen] = useState(false)
  const [avatarOk, setAvatarOk] = useState(false)
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

  if (!user) {
    return null
  }

  return (
    <>
      <div className={`mobile-topbar ${isOpen ? 'mobile-topbar-hidden' : ''}`}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="focus-ring mobile-menu"
        >
          Menu
        </button>
        <div className="mobile-brand">
          <div className="brand-mark" />
          <div>
            <p className="font-display text-lg text-[color:var(--ink-900)]">
              Itinerary
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--ink-600)]">
              Shared planning
            </p>
          </div>
        </div>
      </div>

      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay-open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-head">
          <div className="sidebar-brand">
            <div className="brand-mark" />
            <div>
              <p className="font-display text-xl text-[color:var(--ink-900)]">
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
            className="focus-ring sidebar-close"
          >
            Close
          </button>
        </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={
              location.pathname === item.to
                ? 'sidebar-link sidebar-link-active'
                : 'sidebar-link'
            }
            onClick={() => setIsOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        {!user ? (
          <Link
            to="/login"
            className="sidebar-link sidebar-link-cta"
            onClick={() => setIsOpen(false)}
          >
            Sign in
          </Link>
        ) : null}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className={`user-avatar ${avatarOk ? 'user-avatar-loaded' : ''}`}>
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                onLoad={() => setAvatarOk(true)}
                onError={() => setAvatarOk(false)}
              />
            ) : null}
            <span>{getInitials(name)}</span>
          </div>
          <div className="user-meta">
            <p className="user-name">{name}</p>
            <p className="user-subtitle">
              {user ? 'Signed in with Google' : 'Not signed in'}
            </p>
          </div>
        </div>
        {user ? (
          <button type="button" onClick={signOut} className="user-signout">
            Sign out
          </button>
        ) : null}
      </div>
      </aside>
    </>
  )
}
