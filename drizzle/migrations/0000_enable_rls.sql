create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists itinerary_item_updated_at on itinerary_item;
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

drop policy if exists "trip_members read" on trip_members;
drop policy if exists "trip_members insert" on trip_members;

create policy "trip_members read" on trip_members
for select using (
  user_id = auth.uid()
);

create policy "trip_members insert" on trip_members
for insert with check (
  user_id = auth.uid()
);

drop policy if exists "itinerary items read" on itinerary_item;
drop policy if exists "itinerary items write" on itinerary_item;

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

drop policy if exists "suggestions read" on place_suggestion;
drop policy if exists "suggestions write" on place_suggestion;

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
