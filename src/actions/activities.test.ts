import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, it } from 'vitest';
import { activities, leads } from '~/db/schema';
import { createActivity, deleteActivity } from './activities';
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
