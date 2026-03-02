alter table itinerary_item
  add column if not exists travel_mode text,
  add column if not exists from_place_name text,
  add column if not exists from_place_id text,
  add column if not exists from_lat double precision,
  add column if not exists from_lng double precision,
  add column if not exists to_place_name text,
  add column if not exists to_place_id text,
  add column if not exists to_lat double precision,
  add column if not exists to_lng double precision,
  add column if not exists from_done boolean,
  add column if not exists to_done boolean;
