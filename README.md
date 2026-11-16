# Itinerary Web (TanStack Start)

## Setup

1. Create `.env` from `.env.example` (in the repo root):

```bash
cp .env.example .env
```

2. Fill in:

```
VITE_SUPABASE_URL=https://bqcfoqsfnfyajenlskmj.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SITE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=...
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_PRICE_ID=...
```

3. Run the app:

```bash
bun --bun run dev
```

## Database

`bun run db:migrate`, `db:push` and `db:studio` connect to `DATABASE_URL` through drizzle-kit, which uses the `postgres` (postgres.js) driver. postgres.js v4 retries a connection the server refuses for too many connections (`53300`) until `connect_timeout` has passed (30 s by default), so `drizzle.config.ts` sets it to 2 s through `PGCONNECT_TIMEOUT`: a refused connection fails in about 3 s. A `connect_timeout` in `DATABASE_URL` or an explicit `PGCONNECT_TIMEOUT` overrides it.

## Supabase OAuth Redirects

Add these redirect URLs in Supabase Auth settings:

- `http://localhost:3000/login`
- `https://itinerary.kylescudder.co.uk/login`

If you run the dev server on a different host/port, set `VITE_SITE_URL` to match and add the same URL to the Supabase allow list.

## Google Maps

Enable these APIs for place search:

- Maps JavaScript API
- Places API

## Netlify

Netlify should use the repo root and run:

```
vite build
```

Publish directory:

```
dist/client
```
