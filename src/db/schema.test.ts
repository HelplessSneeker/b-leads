import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, it } from 'vitest';
import { leads } from './schema';

function freshDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { casing: 'snake_case' });
  migrate(db, { migrationsFolder: './drizzle' });
  return db;
}

describe('leads schema', () => {
  let db: ReturnType<typeof freshDb>;

  beforeEach(() => {
    db = freshDb();
  });

  it('inserts a lead and reads it back with generated id + default status', () => {
    db.insert(leads).values({ name: 'Test Lead', email: 't@example.com', source: 'test' }).run();

    const [row] = db.select().from(leads).where(eq(leads.email, 't@example.com')).all();

    expect(row).toBeDefined();
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row.status).toBe('new');
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it('enforces unique email', () => {
    db.insert(leads).values({ name: 'A', email: 'dup@example.com', source: 'test' }).run();
    expect(() =>
      db.insert(leads).values({ name: 'B', email: 'dup@example.com', source: 'test' }).run(),
    ).toThrow();
  });
});
