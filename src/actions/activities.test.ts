import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, it } from 'vitest';
import { activities, leads } from '~/db/schema';
import {
  analyzeActivity,
  createActivity,
  deleteActivity,
  UnsupportedActivityError,
  updateActivity,
} from './activities';
import { createLead, deleteLead, NotFoundError } from './leads';

function freshDb() {
  const sqlite = new Database(':memory:');
  // Mirror the production pragmas — foreign_keys must be ON for cascade deletes.
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { casing: 'snake_case' });
  migrate(db, { migrationsFolder: './drizzle' });
  return db;
}

describe('createActivity', () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
  });

  it("bumps the lead's lastTouchAt to occurredAt when it is newer", () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    expect(lead.lastTouchAt).toBeNull();

    const occurredAt = new Date('2025-06-01T10:00:00Z');
    createActivity(db, { leadId: lead.id, type: 'call', occurredAt, body: 'Erstgespräch' });

    const refreshed = db.select().from(leads).where(eq(leads.id, lead.id)).get();
    expect(refreshed?.lastTouchAt?.getTime()).toBe(occurredAt.getTime());
  });

  it('leaves lastTouchAt unchanged when occurredAt is older than the current value', () => {
    const recent = new Date('2025-06-10T10:00:00Z');
    const [lead] = db
      .insert(leads)
      .values({ name: 'A', email: 'a@example.com', source: 'test', lastTouchAt: recent })
      .returning()
      .all();

    createActivity(db, {
      leadId: lead.id,
      type: 'note',
      occurredAt: new Date('2025-01-01T10:00:00Z'),
      body: 'Alte Notiz',
    });

    const refreshed = db.select().from(leads).where(eq(leads.id, lead.id)).get();
    expect(refreshed?.lastTouchAt?.getTime()).toBe(recent.getTime());
  });

  it('throws NotFoundError for an unknown leadId', () => {
    expect(() =>
      createActivity(db, {
        leadId: '00000000-0000-0000-0000-000000000000',
        type: 'note',
        occurredAt: new Date(),
        body: 'x',
      }),
    ).toThrow(NotFoundError);
  });
});

describe('deleteActivity', () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
  });

  it('recomputes lastTouchAt from the remaining activities', () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    const older = createActivity(db, {
      leadId: lead.id,
      type: 'email_sent',
      occurredAt: new Date('2025-05-01T10:00:00Z'),
      body: 'erste Mail',
    });
    const newer = createActivity(db, {
      leadId: lead.id,
      type: 'email_received',
      occurredAt: new Date('2025-06-01T10:00:00Z'),
      body: 'Antwort',
    });

    deleteActivity(db, { id: newer.id });

    const refreshed = db.select().from(leads).where(eq(leads.id, lead.id)).get();
    expect(refreshed?.lastTouchAt?.getTime()).toBe(older.occurredAt.getTime());
  });

  it('sets lastTouchAt to null when the last activity is deleted', () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    const only = createActivity(db, {
      leadId: lead.id,
      type: 'meeting',
      occurredAt: new Date('2025-06-01T10:00:00Z'),
      body: 'Kickoff',
    });

    deleteActivity(db, { id: only.id });

    const refreshed = db.select().from(leads).where(eq(leads.id, lead.id)).get();
    expect(refreshed?.lastTouchAt).toBeNull();
  });

  it('throws NotFoundError for an unknown id', () => {
    expect(() => deleteActivity(db, { id: '00000000-0000-0000-0000-000000000000' })).toThrow(
      NotFoundError,
    );
  });
});

describe('updateActivity', () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
  });

  it('updates the activity fields', () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    const activity = createActivity(db, {
      leadId: lead.id,
      type: 'note',
      occurredAt: new Date('2025-06-01T10:00:00Z'),
      body: 'alt',
    });

    const updated = updateActivity(db, {
      id: activity.id,
      type: 'call',
      occurredAt: new Date('2025-06-02T12:00:00Z'),
      subject: 'Neuer Betreff',
      body: 'neu',
    });

    expect(updated.type).toBe('call');
    expect(updated.subject).toBe('Neuer Betreff');
    expect(updated.body).toBe('neu');

    const persisted = db.select().from(activities).where(eq(activities.id, activity.id)).get();
    expect(persisted?.body).toBe('neu');
  });

  it('recomputes lastTouchAt when occurredAt moves forward (becomes newest)', () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    const older = createActivity(db, {
      leadId: lead.id,
      type: 'email_sent',
      occurredAt: new Date('2025-05-01T10:00:00Z'),
      body: 'erste Mail',
    });
    createActivity(db, {
      leadId: lead.id,
      type: 'email_received',
      occurredAt: new Date('2025-06-01T10:00:00Z'),
      body: 'Antwort',
    });

    // Push the older activity past the current newest.
    const moved = new Date('2025-07-01T10:00:00Z');
    updateActivity(db, { id: older.id, type: 'email_sent', occurredAt: moved, body: 'erste Mail' });

    const refreshed = db.select().from(leads).where(eq(leads.id, lead.id)).get();
    expect(refreshed?.lastTouchAt?.getTime()).toBe(moved.getTime());
  });

  it('recomputes lastTouchAt when occurredAt moves backward (another becomes newest)', () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    const older = createActivity(db, {
      leadId: lead.id,
      type: 'email_sent',
      occurredAt: new Date('2025-05-01T10:00:00Z'),
      body: 'erste Mail',
    });
    const newer = createActivity(db, {
      leadId: lead.id,
      type: 'email_received',
      occurredAt: new Date('2025-06-01T10:00:00Z'),
      body: 'Antwort',
    });

    // Pull the current newest back before the older one — the older becomes newest.
    updateActivity(db, {
      id: newer.id,
      type: 'email_received',
      occurredAt: new Date('2025-01-01T10:00:00Z'),
      body: 'Antwort',
    });

    const refreshed = db.select().from(leads).where(eq(leads.id, lead.id)).get();
    expect(refreshed?.lastTouchAt?.getTime()).toBe(older.occurredAt.getTime());
  });

  it('throws NotFoundError for an unknown id', () => {
    expect(() =>
      updateActivity(db, {
        id: '00000000-0000-0000-0000-000000000000',
        type: 'note',
        occurredAt: new Date(),
        body: 'x',
      }),
    ).toThrow(NotFoundError);
  });
});

describe('cascade', () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
  });

  it('deleteLead removes all of the lead activities', () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    createActivity(db, { leadId: lead.id, type: 'note', occurredAt: new Date(), body: 'a' });
    createActivity(db, { leadId: lead.id, type: 'call', occurredAt: new Date(), body: 'b' });

    deleteLead(db, { id: lead.id });

    expect(db.select().from(activities).where(eq(activities.leadId, lead.id)).all()).toHaveLength(
      0,
    );
  });
});

describe('analyzeActivity', () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
    // Pin the mock provider so the assertions stay deterministic regardless of a
    // stray LLM_PROVIDER in the environment.
    process.env.LLM_PROVIDER = 'mock';
  });

  it('persists the classification and draft for an inbound email', async () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    const created = createActivity(db, {
      leadId: lead.id,
      type: 'email_received',
      occurredAt: new Date('2025-06-01T10:00:00Z'),
      subject: 'Kurze Rückfrage',
      body: 'Wie sieht euer Preismodell aus?',
    });

    const result = await analyzeActivity(db, { id: created.id });

    expect(result.llmClassification).toEqual({
      sentiment: 'neutral',
      intent: 'other',
      confidence: 0.5,
    });
    expect(result.llmDraft).toContain('Kurze Rückfrage');
    expect(result.llmDraft).toContain('[MOCK DRAFT');

    // Re-read the row to confirm it was actually persisted, not just returned.
    const row = db.select().from(activities).where(eq(activities.id, created.id)).get();
    expect(row?.llmClassification).toEqual({
      sentiment: 'neutral',
      intent: 'other',
      confidence: 0.5,
    });
    expect(row?.llmDraft).toBe(result.llmDraft);
  });

  it('rejects non-inbound activities and leaves the row untouched', async () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    const created = createActivity(db, {
      leadId: lead.id,
      type: 'email_sent',
      occurredAt: new Date('2025-06-01T10:00:00Z'),
      subject: 'Vorstellung',
      body: 'Hallo, ...',
    });

    await expect(analyzeActivity(db, { id: created.id })).rejects.toThrow(UnsupportedActivityError);

    const row = db.select().from(activities).where(eq(activities.id, created.id)).get();
    expect(row?.llmClassification).toBeNull();
    expect(row?.llmDraft).toBeNull();
  });

  it('throws NotFoundError for an unknown activity id', async () => {
    await expect(
      analyzeActivity(db, { id: '00000000-0000-0000-0000-000000000000' }),
    ).rejects.toThrow(NotFoundError);
  });
});
