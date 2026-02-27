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
VITE_GOOGLE_MAPS_API_KEY=...
```

3. Run the app:

```bash
bun --bun run dev
```

## Supabase OAuth Redirects

Add these redirect URLs in Supabase Auth settings:

- `http://localhost:3000/login`
- `https://itinerary.kylescudder.co.uk/login`

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
