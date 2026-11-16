import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

// postgres.js v4 retries a connection refused for too many connections
// (SQLSTATE 53300) until connect_timeout has passed, 30 s by default. drizzle-kit
// creates its own postgres() client and takes no driver options, so set
// connect_timeout: 2 through PGCONNECT_TIMEOUT, which postgres.js reads, to fail
// in about 3 s. A connect_timeout in the URL or an explicit PGCONNECT_TIMEOUT wins.
process.env.PGCONNECT_TIMEOUT ??= '2'

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
})
