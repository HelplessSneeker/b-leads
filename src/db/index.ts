import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const dbPath = process.env.DB_PATH ?? './data/b-leads.db';

const sqlite = new Database(dbPath);
// Better concurrency + durability defaults for a long-running server.
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema, casing: 'snake_case' });
export { schema };
