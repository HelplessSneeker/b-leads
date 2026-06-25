import { desc, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { type Activity, type ActivityType, activities, type Lead, leads } from '~/db/schema';
import { getProvider } from '~/lib/llm';
import { NotFoundError } from './leads';

// Pure CRUD logic for lead activities, separated from the Astro Action layer so it
// can be unit-tested against an in-memory SQLite db. Mirrors the pattern in ./leads:
// takes an injected `db`, throws plain domain errors. Creating/deleting an activity
// keeps the parent lead's `lastTouchAt` in sync (it is derived from activities now).

// Generic over the db's schema so both the production singleton and the schema-less
// test db are accepted (see the note in ./leads).
type ActivitiesDb<S extends Record<string, unknown>> = BetterSQLite3Database<S>;

/** Fields accepted from the validated Zod form input (post-parse shape). */
export interface CreateActivityInput {
  leadId: string;
  type: ActivityType;
  occurredAt: Date;
  subject?: string;
  body: string;
}

export function createActivity<S extends Record<string, unknown>>(
  db: ActivitiesDb<S>,
  input: CreateActivityInput,
): Activity {
  const lead = db.select().from(leads).where(eq(leads.id, input.leadId)).get();
  if (!lead) throw new NotFoundError();

  const activity = db
    .insert(activities)
    .values({
      leadId: input.leadId,
      type: input.type,
      subject: input.subject,
      body: input.body,
      occurredAt: input.occurredAt,
    })
    .returning()
    .get();

  // lastTouchAt tracks the most recent activity — only bump it forward.
  const previous = lead.lastTouchAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  if (input.occurredAt.getTime() > previous) {
    db.update(leads)
      .set({ lastTouchAt: input.occurredAt, updatedAt: new Date() })
      .where(eq(leads.id, input.leadId))
      .run();
  }

  return activity;
}

/** Fields accepted from the validated Zod form input (post-parse shape). */
export interface UpdateActivityInput {
  id: string;
  type: ActivityType;
  occurredAt: Date;
  subject?: string;
  body: string;
}

export function updateActivity<S extends Record<string, unknown>>(
  db: ActivitiesDb<S>,
  input: UpdateActivityInput,
): Activity {
  const existing = db.select().from(activities).where(eq(activities.id, input.id)).get();
  if (!existing) throw new NotFoundError('Aktivität nicht gefunden');

  const activity = db
    .update(activities)
    .set({
      type: input.type,
      subject: input.subject,
      body: input.body,
      occurredAt: input.occurredAt,
    })
    .where(eq(activities.id, input.id))
    .returning()
    .get();

  // occurredAt may have moved in either direction — recompute lastTouchAt from all
  // of the lead's activities rather than only bumping forward.
  recomputeLastTouch(db, existing.leadId);

  return activity;
}

export function deleteActivity<S extends Record<string, unknown>>(
  db: ActivitiesDb<S>,
  input: { id: string },
): void {
  const existing = db.select().from(activities).where(eq(activities.id, input.id)).get();
  if (!existing) throw new NotFoundError('Aktivität nicht gefunden');

  db.delete(activities).where(eq(activities.id, input.id)).run();

  // Recompute lastTouchAt from the remaining activities (may become null).
  recomputeLastTouch(db, existing.leadId);
}

/** Sets the lead's lastTouchAt to the newest of its activities (null if none remain). */
function recomputeLastTouch<S extends Record<string, unknown>>(
  db: ActivitiesDb<S>,
  leadId: string,
): void {
  const latest = db
    .select()
    .from(activities)
    .where(eq(activities.leadId, leadId))
    .orderBy(desc(activities.occurredAt))
    .get();

  db.update(leads)
    .set({ lastTouchAt: latest ? latest.occurredAt : null, updatedAt: new Date() })
    .where(eq(leads.id, leadId))
    .run();
}

/** Raised when an LLM analysis is requested for an activity that is not an inbound email. */
export class UnsupportedActivityError extends Error {
  constructor(message = 'Analyse nur für eingegangene E-Mails verfügbar') {
    super(message);
    this.name = 'UnsupportedActivityError';
  }
}

/** Compact, single-string lead summary handed to the provider as draft context. The
 *  MockProvider ignores it, but real providers (S2+) prompt against it — keep it filled. */
function buildLeadContext(lead: Lead): string {
  const who = [lead.name, lead.role, lead.company].filter(Boolean).join(', ');
  const parts = [who, `Status: ${lead.status}`];
  if (lead.notes) parts.push(`Notizen: ${lead.notes}`);
  return parts.join(' — ');
}

/**
 * Runs the configured LLM provider over an inbound email activity and persists both the
 * classification and the reply draft onto the activity row. Only `email_received` activities
 * are eligible; anything else throws `UnsupportedActivityError`. Does not touch lastTouchAt —
 * analysing an existing entry is not a new touchpoint. An optional `signal` is forwarded to
 * the provider so a cancelled client request aborts the in-flight LLM generation.
 */
export async function analyzeActivity<S extends Record<string, unknown>>(
  db: ActivitiesDb<S>,
  input: { id: string },
  signal?: AbortSignal,
): Promise<Activity> {
  const activity = db.select().from(activities).where(eq(activities.id, input.id)).get();
  if (!activity) throw new NotFoundError('Aktivität nicht gefunden');
  if (activity.type !== 'email_received') throw new UnsupportedActivityError();

  const lead = db.select().from(leads).where(eq(leads.id, activity.leadId)).get();
  if (!lead) throw new NotFoundError();

  const provider = getProvider();
  const mail = { subject: activity.subject ?? '', body: activity.body };
  const llmClassification = await provider.classify(mail, signal);
  const llmDraft = await provider.draftReply(mail, buildLeadContext(lead), signal);

  return db
    .update(activities)
    .set({ llmClassification, llmDraft })
    .where(eq(activities.id, input.id))
    .returning()
    .get();
}
