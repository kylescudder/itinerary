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

drop trigger if exists place_cache_updated_at on place_cache;
create trigger place_cache_updated_at
before update on place_cache
for each row execute function set_updated_at();

alter table place_cache enable row level security;

drop policy if exists "place cache read" on place_cache;
drop policy if exists "place cache write" on place_cache;

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
