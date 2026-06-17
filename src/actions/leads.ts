import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { type Lead, type LeadStatus, leads } from '~/db/schema';

// Pure CRUD logic, separated from the Astro Action layer so it can be unit-tested
// against an in-memory SQLite db. These functions take an injected `db` and throw
// plain domain errors; `src/actions/index.ts` translates those into ActionError.

// The CRUD functions are generic over the db's schema so both the production
// singleton (`BetterSQLite3Database<typeof schema>`) and the schema-less test db are
// accepted (the schema generic is invariant, so a shared alias would reject one).
type LeadsDb<S extends Record<string, unknown>> = BetterSQLite3Database<S>;

/** Thrown when an email collides with the UNIQUE constraint on leads.email. */
export class ConflictError extends Error {
  readonly code = 'CONFLICT' as const;
  constructor(message = 'Lead mit dieser E-Mail existiert bereits') {
    super(message);
    this.name = 'ConflictError';
  }
}

/** Thrown when an update/delete targets a lead id that does not exist. */
export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND' as const;
  constructor(message = 'Lead nicht gefunden') {
    super(message);
    this.name = 'NotFoundError';
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    (err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE'
  );
}

/** Fields accepted from the validated Zod form input (post-parse shape). */
export interface LeadFields {
  name: string;
  email: string;
  company?: string;
  role?: string;
  source: string;
  status?: LeadStatus;
  nextAction?: string;
  notes?: string;
}

export type CreateLeadInput = LeadFields;
export type UpdateLeadInput = LeadFields & { id: string };

/** Statuses whose (re-)entry counts as "touching" the lead. */
const TOUCH_STATUSES: readonly LeadStatus[] = ['contacted', 'replied'];

export function createLead<S extends Record<string, unknown>>(
  db: LeadsDb<S>,
  input: CreateLeadInput,
): Lead {
  try {
    return db
      .insert(leads)
      .values({
        name: input.name,
        email: input.email,
        company: input.company,
        role: input.role,
        source: input.source,
        status: input.status ?? 'new',
        nextAction: input.nextAction,
        notes: input.notes,
      })
      .returning()
      .get();
  } catch (err) {
    if (isUniqueViolation(err)) throw new ConflictError();
    throw err;
  }
}

export function updateLead<S extends Record<string, unknown>>(
  db: LeadsDb<S>,
  input: UpdateLeadInput,
): Lead {
  const existing = db.select().from(leads).where(eq(leads.id, input.id)).get();
  if (!existing) throw new NotFoundError();

  const nextStatus = input.status ?? existing.status;
  // Bump lastTouchAt only when the status changes *into* contacted/replied.
  const enteringTouchStatus = nextStatus !== existing.status && TOUCH_STATUSES.includes(nextStatus);
  const lastTouchAt = enteringTouchStatus ? new Date() : existing.lastTouchAt;

  try {
    return db
      .update(leads)
      .set({
        name: input.name,
        email: input.email,
        company: input.company,
        role: input.role,
        source: input.source,
        status: nextStatus,
        nextAction: input.nextAction,
        notes: input.notes,
        lastTouchAt,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, input.id))
      .returning()
      .get();
  } catch (err) {
    if (isUniqueViolation(err)) throw new ConflictError();
    throw err;
  }
}

export function deleteLead<S extends Record<string, unknown>>(
  db: LeadsDb<S>,
  input: { id: string },
): void {
  const result = db.delete(leads).where(eq(leads.id, input.id)).run();
  if (result.changes === 0) throw new NotFoundError();
  // Replies cascade via the FK (requires `PRAGMA foreign_keys = ON`).
}
