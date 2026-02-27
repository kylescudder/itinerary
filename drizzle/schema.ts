import {
  boolean,
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
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
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
    uniqueMember: uniqueIndex('trip_members_trip_user').on(table.tripId, table.userId),
  })
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
