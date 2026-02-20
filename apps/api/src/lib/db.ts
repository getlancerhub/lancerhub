import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  index,
} from 'drizzle-orm/pg-core'

// Database connection
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://lancerhub:lancerhub@postgres:5432/lancerhub'

const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client)

// Users table schema (copied from packages/db for self-contained API)
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash'),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),
    emailVerificationToken: text('email_verification_token'),
    passwordResetToken: text('password_reset_token'),
    passwordResetExpires: timestamp('password_reset_expires'),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
)
