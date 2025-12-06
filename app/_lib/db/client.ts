// ═══════════════════════════════════════════════════════════════
// CHRONOS INFINITY 2026 — TURSO DATABASE CLIENT
// Cliente de base de datos con soporte realtime
// ═══════════════════════════════════════════════════════════════

import { drizzle } from 'drizzle-orm/libsql'
import { createClient, type Client } from '@libsql/client'
import * as schema from '@/database/schema'

// Singleton pattern para evitar múltiples conexiones
let client: Client | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL || 'file:database/sqlite.db',
      authToken: process.env.DATABASE_AUTH_TOKEN,
    })
  }
  return client
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getClient(), { schema })
  }
  return dbInstance
}

// Re-export para compatibilidad
export const db = getDb()
export type DB = typeof db

// Tipos exportados
export * from '@/database/schema'
