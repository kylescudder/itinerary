-- Supabase schema for Itinerary app

create extension if not exists "uuid-ossp";

create table if not exists trip (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists trip_members (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trip(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create table if not exists itinerary_item (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trip(id) on delete cascade,
  type text not null,
  title text not null,
  notes text,
  start_time timestamptz,
  done boolean not null default false,
  lat double precision,
  lng double precision,
  place_name text,
  place_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists place_suggestion (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trip(id) on delete cascade,
  type text not null,
  title text not null,
  notes text,
  lat double precision,
  lng double precision,
  place_name text,
  place_id text,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger itinerary_item_updated_at
before update on itinerary_item
for each row execute function set_updated_at();

alter table trip enable row level security;
alter table trip_members enable row level security;
alter table itinerary_item enable row level security;
alter table place_suggestion enable row level security;

drop policy if exists "trip members read" on trip;
drop policy if exists "trip members write" on trip;
drop policy if exists "trip members insert" on trip;

create policy "trip members read" on trip
for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip.id
      and trip_members.user_id = auth.uid()
  )
);

create policy "trip members write" on trip
for update using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip.id
      and trip_members.user_id = auth.uid()
  )
);

create policy "trip members insert" on trip
for insert with check (auth.uid() is not null);

create policy "trip_members read" on trip_members
for select using (
  user_id = auth.uid()
);

create policy "trip_members insert" on trip_members
for insert with check (
  user_id = auth.uid()
);

create policy "itinerary items read" on itinerary_item
for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = itinerary_item.trip_id
      and trip_members.user_id = auth.uid()
  )
);

create policy "itinerary items write" on itinerary_item
for all using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = itinerary_item.trip_id
      and trip_members.user_id = auth.uid()
  )
);

create policy "suggestions read" on place_suggestion
for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = place_suggestion.trip_id
      and trip_members.user_id = auth.uid()
  )
);

create policy "suggestions write" on place_suggestion
for all using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = place_suggestion.trip_id
      and trip_members.user_id = auth.uid()
  )
);
