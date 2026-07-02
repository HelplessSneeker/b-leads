import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Lead pipeline status. */
export const LEAD_STATUSES = ['new', 'contacted', 'replied', 'qualified', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Kind of touchpoint logged against a lead. */
export const ACTIVITY_TYPES = [
  'email_sent',
  'email_received',
  'linkedin_sent',
  'linkedin_received',
  'call',
  'meeting',
  'note',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Shape of the LLM classification stored as JSON on an activity (Phase 3). */
export interface LlmClassification {
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'interested' | 'pricing' | 'not-now' | 'no' | 'question' | 'other';
  confidence: number;
}

export const leads = sqliteTable(
  'leads',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    company: text('company'),
    role: text('role'),
    // e.g. "outreach-wave-1", "referral", "linkedin"
    source: text('source').notNull(),
    status: text('status', { enum: LEAD_STATUSES }).notNull().default('new'),
    nextAction: text('next_action'),
    lastTouchAt: integer('last_touch_at', { mode: 'timestamp' }),
    // When to follow up next; drives the "Heute fällig" view.
    followUpAt: integer('follow_up_at', { mode: 'timestamp' }),
    // Markdown
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('leads_status_idx').on(table.status)],
);

export const activities = sqliteTable(
  'activities',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ACTIVITY_TYPES }).notNull(),
    // Calls/notes have no subject, so it is nullable; the body is always required.
    subject: text('subject'),
    body: text('body').notNull(),
    occurredAt: integer('occurred_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    // { sentiment, intent, confidence } — filled in Phase 3
    llmClassification: text('llm_classification', { mode: 'json' }).$type<LlmClassification>(),
    llmDraft: text('llm_draft'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('activities_lead_id_idx').on(table.leadId)],
);

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
});

// Magic-link tokens. Only the SHA-256 hash is stored so a DB leak
// cannot be replayed against /auth/verify.
export const authTokens = sqliteTable(
  'auth_tokens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tokenHash: text('token_hash').notNull().unique(),
    email: text('email').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    consumedAt: integer('consumed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('auth_tokens_email_idx').on(table.email)],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;
