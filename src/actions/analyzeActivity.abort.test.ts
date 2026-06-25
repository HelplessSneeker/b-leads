import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Inject a provider whose classify only settles when its AbortSignal fires, so we can
// prove the signal threads analyzeActivity -> getProvider() -> provider and that an
// abort rejects the in-flight run. Isolated in its own file: vi.mock is file-scoped, so
// it doesn't disturb activities.test.ts, which exercises the real MockProvider.
let lastSignal: AbortSignal | undefined;
vi.mock('~/lib/llm', () => ({
  getProvider: () => ({
    classify: (_mail: unknown, signal?: AbortSignal) => {
      lastSignal = signal;
      return new Promise((_resolve, reject) => {
        // Mirror the OpenAI SDK: reject on abort, and also if already aborted upfront.
        const abort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
        if (signal?.aborted) return abort();
        signal?.addEventListener('abort', abort);
      });
    },
    draftReply: async () => 'draft',
  }),
}));

import { analyzeActivity, createActivity } from './activities';
import { createLead } from './leads';

function freshDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { casing: 'snake_case' });
  migrate(db, { migrationsFolder: './drizzle' });
  return db;
}

describe('analyzeActivity cancellation', () => {
  let db: ReturnType<typeof freshDb>;
  beforeEach(() => {
    db = freshDb();
    lastSignal = undefined;
  });

  function seedInboundEmail() {
    const lead = createLead(db, { name: 'A', email: 'a@example.com', source: 'test' });
    return createActivity(db, {
      leadId: lead.id,
      type: 'email_received',
      occurredAt: new Date('2025-06-01T10:00:00Z'),
      subject: 'Frage',
      body: 'Wie sieht euer Preismodell aus?',
    });
  }

  it('forwards the AbortSignal to the provider', async () => {
    const created = seedInboundEmail();
    const controller = new AbortController();

    const promise = analyzeActivity(db, { id: created.id }, controller.signal);
    // The provider has been called and received our exact signal.
    expect(lastSignal).toBe(controller.signal);

    controller.abort();
    await expect(promise).rejects.toThrow(/abort/i);
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const created = seedInboundEmail();
    const controller = new AbortController();
    controller.abort();

    await expect(analyzeActivity(db, { id: created.id }, controller.signal)).rejects.toThrow(
      /abort/i,
    );
  });
});
