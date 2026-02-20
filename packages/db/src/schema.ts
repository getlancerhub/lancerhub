import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  decimal,
  json,
  index,
  unique,
} from 'drizzle-orm/pg-core'

// Users and Authentication
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

// Workspaces
export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 50 }).notNull().unique(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    domain: varchar('domain', { length: 255 }),
    logo: text('logo'),
    brandColor: varchar('brand_color', { length: 7 }),
    stripeAccountId: text('stripe_account_id'),
    stripeOnboardingComplete: boolean('stripe_onboarding_complete')
      .default(false)
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    slugIdx: index('workspaces_slug_idx').on(table.slug),
    ownerIdx: index('workspaces_owner_idx').on(table.ownerId),
  })
)

// Workspace members
export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: varchar('role', { length: 20 }).notNull(), // owner, admin, member
    invitedAt: timestamp('invited_at'),
    joinedAt: timestamp('joined_at'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    workspaceUserUnique: unique().on(table.workspaceId, table.userId),
    workspaceIdx: index('workspace_members_workspace_idx').on(
      table.workspaceId
    ),
    userIdx: index('workspace_members_user_idx').on(table.userId),
  })
)

// Clients
export const clients = pgTable(
  'clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    email: varchar('email', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    company: varchar('company', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    timezone: varchar('timezone', { length: 50 }),
    notes: text('notes'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workspaceEmailUnique: unique().on(table.workspaceId, table.email),
    workspaceIdx: index('clients_workspace_idx').on(table.workspaceId),
    emailIdx: index('clients_email_idx').on(table.email),
  })
)

// Projects
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, active, completed, cancelled
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
    currency: varchar('currency', { length: 3 }).default('USD'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    expectedCompletionDate: timestamp('expected_completion_date'),
    isVisible: boolean('is_visible').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workspaceIdx: index('projects_workspace_idx').on(table.workspaceId),
    clientIdx: index('projects_client_idx').on(table.clientId),
    statusIdx: index('projects_status_idx').on(table.status),
  })
)

// Project milestones
export const milestones = pgTable(
  'milestones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    amount: decimal('amount', { precision: 10, scale: 2 }),
    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),
    order: integer('order').notNull().default(0),
    isVisible: boolean('is_visible').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    projectIdx: index('milestones_project_idx').on(table.projectId),
    orderIdx: index('milestones_order_idx').on(table.order),
  })
)

// Invoices
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    projectId: uuid('project_id').references(() => projects.id),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    number: varchar('number', { length: 50 }).notNull(),
    stripeInvoiceId: text('stripe_invoice_id'),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, sent, paid, overdue, cancelled
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('USD'),
    dueDate: timestamp('due_date'),
    paidAt: timestamp('paid_at'),
    sentAt: timestamp('sent_at'),
    notes: text('notes'),
    lineItems: json('line_items'), // Array of invoice items
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workspaceNumberUnique: unique().on(table.workspaceId, table.number),
    workspaceIdx: index('invoices_workspace_idx').on(table.workspaceId),
    clientIdx: index('invoices_client_idx').on(table.clientId),
    statusIdx: index('invoices_status_idx').on(table.status),
    stripeIdx: index('invoices_stripe_idx').on(table.stripeInvoiceId),
  })
)

// Forms
export const forms = pgTable(
  'forms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    name: varchar('name', { length: 200 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // lead, scope_change, feedback
    slug: varchar('slug', { length: 100 }).notNull(),
    description: text('description'),
    fields: json('fields').notNull(), // Form field configuration
    settings: json('settings'), // Form settings (notifications, redirects, etc.)
    isActive: boolean('is_active').default(true).notNull(),
    isPublic: boolean('is_public').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workspaceSlugUnique: unique().on(table.workspaceId, table.slug),
    workspaceIdx: index('forms_workspace_idx').on(table.workspaceId),
    typeIdx: index('forms_type_idx').on(table.type),
  })
)

// Form submissions
export const formSubmissions = pgTable(
  'form_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    formId: uuid('form_id')
      .notNull()
      .references(() => forms.id),
    clientId: uuid('client_id').references(() => clients.id),
    data: json('data').notNull(), // Submitted form data
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    isProcessed: boolean('is_processed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    formIdx: index('form_submissions_form_idx').on(table.formId),
    clientIdx: index('form_submissions_client_idx').on(table.clientId),
    createdIdx: index('form_submissions_created_idx').on(table.createdAt),
  })
)

// Files and deliverables
export const files = pgTable(
  'files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    projectId: uuid('project_id').references(() => projects.id),
    clientId: uuid('client_id').references(() => clients.id),
    name: varchar('name', { length: 255 }).notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }),
    size: integer('size'), // bytes
    path: text('path').notNull(), // S3 path
    type: varchar('type', { length: 20 }).notNull(), // deliverable, attachment, avatar
    isPublic: boolean('is_public').default(false).notNull(),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    workspaceIdx: index('files_workspace_idx').on(table.workspaceId),
    projectIdx: index('files_project_idx').on(table.projectId),
    typeIdx: index('files_type_idx').on(table.type),
  })
)

// API keys
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    name: varchar('name', { length: 100 }).notNull(),
    keyHash: text('key_hash').notNull(), // Hashed API key
    prefix: varchar('prefix', { length: 10 }).notNull(), // First few chars for identification
    permissions: json('permissions'), // Array of permissions
    lastUsedAt: timestamp('last_used_at'),
    expiresAt: timestamp('expires_at'),
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    workspaceIdx: index('api_keys_workspace_idx').on(table.workspaceId),
    hashIdx: index('api_keys_hash_idx').on(table.keyHash),
  })
)

// Webhooks
export const webhooks = pgTable(
  'webhooks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    url: text('url').notNull(),
    events: json('events').notNull(), // Array of event types to subscribe to
    secret: text('secret'), // Webhook secret for verification
    isActive: boolean('is_active').default(true).notNull(),
    lastTriggeredAt: timestamp('last_triggered_at'),
    failureCount: integer('failure_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    workspaceIdx: index('webhooks_workspace_idx').on(table.workspaceId),
  })
)

// Event outbox for reliable event delivery
export const eventOutbox = pgTable(
  'event_outbox',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: json('payload').notNull(),
    attemptCount: integer('attempt_count').default(0),
    maxAttempts: integer('max_attempts').default(3),
    nextRetry: timestamp('next_retry'),
    processedAt: timestamp('processed_at'),
    failedAt: timestamp('failed_at'),
    error: text('error'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    workspaceIdx: index('event_outbox_workspace_idx').on(table.workspaceId),
    typeIdx: index('event_outbox_type_idx').on(table.eventType),
    statusIdx: index('event_outbox_status_idx').on(table.processedAt),
    retryIdx: index('event_outbox_retry_idx').on(table.nextRetry),
  })
)

// Email logs
export const emailLogs = pgTable(
  'email_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    to: varchar('to', { length: 255 }).notNull(),
    from: varchar('from', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    template: varchar('template', { length: 100 }),
    status: varchar('status', { length: 20 }).notNull(), // sent, failed, bounced
    providerMessageId: text('provider_message_id'),
    error: text('error'),
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    workspaceIdx: index('email_logs_workspace_idx').on(table.workspaceId),
    statusIdx: index('email_logs_status_idx').on(table.status),
    createdIdx: index('email_logs_created_idx').on(table.createdAt),
  })
)
