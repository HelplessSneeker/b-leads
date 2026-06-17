import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, it } from 'vitest';
import { leads } from '~/db/schema';
import { ConflictError, createLead, deleteLead, NotFoundError, updateLead } from './leads';

function freshDb() {
  const sqlite = new Database(':memory:');
  // Mirror the production pragmas — foreign_keys must be ON for cascade deletes.
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { casing: 'snake_case' });
  migrate(db, { migrationsFolder: './drizzle' });
  return db;
}

describe('createLead', () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
  });

  it('inserts a lead and returns it with generated id + default status', () => {
    const row = createLead(db, { name: 'Test Lead', email: 't@example.com', source: 'test' });

    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row.status).toBe('new');
    expect(row.createdAt).toBeInstanceOf(Date);

    const [persisted] = db.select().from(leads).where(eq(leads.id, row.id)).all();
    expect(persisted).toBeDefined();
    expect(persisted.email).toBe('t@example.com');
  });

  it('throws ConflictError on duplicate email', () => {
    createLead(db, { name: 'A', email: 'dup@example.com', source: 'test' });
    expect(() => createLead(db, { name: 'B', email: 'dup@example.com', source: 'test' })).toThrow(
      ConflictError,
    );
  });
});

describe('updateLead', () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
  });

  it('leaves lastTouchAt untouched (it is driven by activities now)', () => {
    const fixed = new Date('2025-01-01T10:00:00Z');
    const [lead] = db
      .insert(leads)
      .values({ name: 'A', email: 'a@example.com', source: 'test', lastTouchAt: fixed })
      .returning()
      .all();

    const updated = updateLead(db, {
      id: lead.id,
      name: 'A (edited)',
      email: 'a@example.com',
      source: 'test',
      status: 'contacted',
    });

    expect(updated.name).toBe('A (edited)');
    expect(updated.lastTouchAt?.getTime()).toBe(fixed.getTime());
  });

  it('throws ConflictError when changing email to an existing one', () => {
    createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    const b = createLead(db, { name: 'B', email: 'b@example.com', source: 'test' });

    expect(() =>
      updateLead(db, { id: b.id, name: 'B', email: 'a@example.com', source: 'test' }),
    ).toThrow(ConflictError);
  });

  it('throws NotFoundError for an unknown id', () => {
    expect(() =>
      updateLead(db, {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'X',
        email: 'x@example.com',
        source: 'test',
      }),
    ).toThrow(NotFoundError);
  });
});

describe('deleteLead', () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
  });

  it('removes the lead', () => {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });

    deleteLead(db, { id: lead.id });

    expect(db.select().from(leads).where(eq(leads.id, lead.id)).get()).toBeUndefined();
  });

  it('throws NotFoundError for an unknown id', () => {
    expect(() => deleteLead(db, { id: '00000000-0000-0000-0000-000000000000' })).toThrow(
      NotFoundError,
    );
  });
});
