import { desc, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { type Activity, type ActivityType, activities, leads } from '~/db/schema';
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

export function deleteActivity<S extends Record<string, unknown>>(
  db: ActivitiesDb<S>,
  input: { id: string },
): void {
  const existing = db.select().from(activities).where(eq(activities.id, input.id)).get();
  if (!existing) throw new NotFoundError('Aktivität nicht gefunden');

  db.delete(activities).where(eq(activities.id, input.id)).run();

  // Recompute lastTouchAt from the remaining activities (may become null).
  const latest = db
    .select()
    .from(activities)
    .where(eq(activities.leadId, existing.leadId))
    .orderBy(desc(activities.occurredAt))
    .get();

  db.update(leads)
    .set({ lastTouchAt: latest ? latest.occurredAt : null, updatedAt: new Date() })
    .where(eq(leads.id, existing.leadId))
    .run();
}
