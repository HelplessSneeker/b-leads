import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Lead pipeline status. */
export const LEAD_STATUSES = ['new', 'contacted', 'replied', 'qualified', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Direction of a reply relative to us. */
export const REPLY_DIRECTIONS = ['inbound', 'outbound'] as const;
export type ReplyDirection = (typeof REPLY_DIRECTIONS)[number];

/** Shape of the LLM classification stored as JSON on a reply (Phase 3). */
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
    // Markdown
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('leads_status_idx').on(table.status)],
);

export const replies = sqliteTable(
  'replies',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    direction: text('direction', { enum: REPLY_DIRECTIONS }).notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    receivedAt: integer('received_at', { mode: 'timestamp' }),
    sentAt: integer('sent_at', { mode: 'timestamp' }),
    // { sentiment, intent, confidence } — filled in Phase 3
    llmClassification: text('llm_classification', { mode: 'json' }).$type<LlmClassification>(),
    llmDraft: text('llm_draft'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('replies_lead_id_idx').on(table.leadId)],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Reply = typeof replies.$inferSelect;
export type NewReply = typeof replies.$inferInsert;
