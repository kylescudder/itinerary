import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  doublePrecision,
} from 'drizzle-orm/pg-core'

export const trip = pgTable('trip', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  stripeSessionId: text('stripe_session_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
})

export const tripMembers = pgTable(
  'trip_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id')
      .references(() => trip.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').notNull(),
    role: text('role').notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueMember: uniqueIndex('trip_members_trip_user').on(
      table.tripId,
      table.userId,
    ),
  }),
)

export const itineraryItem = pgTable('itinerary_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id')
    .references(() => trip.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  notes: text('notes'),
  startTime: timestamp('start_time', { withTimezone: true }),
  done: boolean('done').notNull().default(false),
  travelMode: text('travel_mode'),
  fromPlaceName: text('from_place_name'),
  fromPlaceId: text('from_place_id'),
  fromLat: doublePrecision('from_lat'),
  fromLng: doublePrecision('from_lng'),
  toPlaceName: text('to_place_name'),
  toPlaceId: text('to_place_id'),
  toLat: doublePrecision('to_lat'),
  toLng: doublePrecision('to_lng'),
  fromDone: boolean('from_done'),
  toDone: boolean('to_done'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  placeName: text('place_name'),
  placeId: text('place_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const placeSuggestion = pgTable('place_suggestion', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id')
    .references(() => trip.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  notes: text('notes'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  placeName: text('place_name'),
  placeId: text('place_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const placeCache = pgTable(
  'place_cache',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id')
      .references(() => trip.id, { onDelete: 'cascade' })
      .notNull(),
    placeId: text('place_id').notNull(),
    description: text('description').notNull(),
    primaryText: text('primary_text'),
    secondaryText: text('secondary_text'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniquePlace: uniqueIndex('place_cache_trip_place').on(
      table.tripId,
      table.placeId,
    ),
  }),
)
