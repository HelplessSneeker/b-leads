import { defineConfig } from 'drizzle-kit';

const dbPath = process.env.DB_PATH ?? './data/b-leads.db';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: dbPath },
  casing: 'snake_case',
});
