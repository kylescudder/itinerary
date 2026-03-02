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
  travel_mode text,
  from_place_name text,
  from_place_id text,
  from_lat double precision,
  from_lng double precision,
  to_place_name text,
  to_place_id text,
  to_lat double precision,
  to_lng double precision,
  from_done boolean,
  to_done boolean,
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

create table if not exists place_cache (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trip(id) on delete cascade,
  place_id text not null,
  description text not null,
  primary_text text,
  secondary_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, place_id)
);

create or replace function join_trip(invite_code text)
returns trip
language plpgsql
security definer
set search_path = public
as $$
declare
  target trip;
begin
  if auth.uid() is null then
    raise exception 'Please sign in to continue.';
  end if;

  select * into target from trip where code = invite_code;
  if target is null then
    raise exception 'Trip not found.';
  end if;

  insert into trip_members (trip_id, user_id, role)
  values (target.id, auth.uid(), 'member')
  on conflict (trip_id, user_id)
  do update set role = excluded.role;

  return target;
end;
$$;

grant execute on function join_trip(text) to authenticated;

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
alter table place_cache enable row level security;

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

create policy "place cache read" on place_cache
for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = place_cache.trip_id
      and trip_members.user_id = auth.uid()
  )
);

create policy "place cache write" on place_cache
for all using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = place_cache.trip_id
      and trip_members.user_id = auth.uid()
  )
);
