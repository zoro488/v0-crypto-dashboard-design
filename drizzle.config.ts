import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './database/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:database/sqlite.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
})
