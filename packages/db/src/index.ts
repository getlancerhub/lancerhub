import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export * from './schema'

// Create database connection
export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString })
  return drizzle(pool, { schema })
}

// Default database instance (uses DATABASE_URL from env)
export const db = createDatabase(process.env.DATABASE_URL!)

export const dbVersion = '1.0.0'
