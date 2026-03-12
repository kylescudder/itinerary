# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use **Bun** as the package manager.

```bash
bun dev          # Start development server
bun run build    # Production build
bun run test     # Run tests (Vitest)
bun run lint     # ESLint
bun run check    # Autofix with Prettier + ESLint

# Database (Drizzle ORM)
bun run db:generate   # Generate migrations from schema
bun run db:push       # Push schema changes directly
bun run db:migrate    # Run pending migrations
bun run db:studio     # Open visual DB explorer
```

To run a single test: `bun run test -- path/to/file.test.ts`

## Architecture

**Next.js 15 App Router** with Supabase (PostgreSQL) backend, Drizzle ORM, Stripe billing, and Google Maps.

### Key patterns

**API Layer** (`src/lib/api.ts`): Client-side abstraction over REST endpoints. Injects Bearer auth tokens, falls back to localStorage cache when offline, and queues pending operations for sync.

**Auth** (`src/lib/auth.tsx`): React context provider wrapping Supabase Auth with PKCE flow. Server-side routes use `requireSupabaseUser()` from `src/lib/supabaseServer.ts`.

**Offline-first**: Service worker (`public/sw.js`) + localStorage caching (`src/lib/offline.ts`) + sync queue (`src/lib/offlineSync.ts`). The app shell (`src/app/shell.tsx`) sets up auth and offline sync on mount.

**Database schema** (`drizzle/schema.ts`): `trip`, `trip_members`, `itinerary_item`, `place_suggestion`, `place_cache`. A Postgres function `join_trip(invite_code)` handles invite-based membership. Path alias `@/*` maps to `src/*`.

### API routes (`src/app/api/`)

- `trips/` — CRUD for trips; `trips/[tripId]/itinerary-items/`, `suggestions/`, `place-cache/`
- `itinerary-items/[itemId]/` — per-item operations
- `stripe/checkout/`, `stripe/session-status/` — payment flow

### Environment variables

See `.env.example`. Required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`.

### Code style

Prettier config: no semicolons, single quotes, trailing commas. Run `bun run check` to autofix before committing.
