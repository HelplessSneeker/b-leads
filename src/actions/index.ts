import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { ACTIVITY_TYPES, LEAD_STATUSES, leads } from '~/db/schema';
import {
  analyzeActivity as analyzeActivityCore,
  createActivity as createActivityCore,
  deleteActivity as deleteActivityCore,
  UnsupportedActivityError,
  updateActivity as updateActivityCore,
} from './activities';
import { authActions } from './auth';
import {
  ConflictError,
  createLead as createLeadCore,
  deleteLead as deleteLeadCore,
  NotFoundError,
  updateLead as updateLeadCore,
  updateLeadStatus as updateLeadStatusCore,
} from './leads';

// Thin Action adapters: validate via Zod, call the pure CRUD functions in
// ./leads with the db singleton, and translate domain errors into ActionError.

/** Map a domain error from ./leads onto the matching ActionError, else rethrow. */
function toActionError(err: unknown): never {
  if (err instanceof ConflictError) {
    throw new ActionError({ code: 'CONFLICT', message: err.message });
  }
  if (err instanceof NotFoundError) {
    throw new ActionError({ code: 'NOT_FOUND', message: err.message });
  }
  if (err instanceof UnsupportedActivityError) {
    throw new ActionError({ code: 'BAD_REQUEST', message: err.message });
  }
  throw err;
}

const leadInput = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail'),
  company: z.string().optional(),
  role: z.string().optional(),
  source: z.string().min(1, 'Quelle ist erforderlich'),
  status: z.enum(LEAD_STATUSES).default('new'),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
  // The date input sends '' when cleared; treat that as null (no follow-up).
  followUpAt: z
    .preprocess((v) => (v === '' || v == null ? null : v), z.coerce.date().nullable())
    .optional(),
});

// Strict per-row schema for CSV import, validated row-by-row in the handler so one
// bad row is skipped (counted as `invalid`) rather than failing the whole batch.
const importRow = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  role: z.string().optional(),
  source: z.string().min(1),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
});

// In-flight LLM analyses, keyed by activity id, so `cancelAnalysis` can abort the
// matching `analyzeActivity` run. Module-level → shared across requests in the single
// SSR process (same lifetime model as the db singleton).
const analysisAborters = new Map<string, AbortController>();

export const server = {
  ...authActions,

  createLead: defineAction({
    accept: 'form',
    input: leadInput,
    handler: async (input) => {
      try {
        const lead = createLeadCore(db, input);
        return { id: lead.id };
      } catch (err) {
        return toActionError(err);
      }
    },
  }),

  updateLead: defineAction({
    accept: 'form',
    input: leadInput.extend({ id: z.string().uuid() }),
    handler: async (input) => {
      try {
        const lead = updateLeadCore(db, input);
        return { id: lead.id };
      } catch (err) {
        return toActionError(err);
      }
    },
  }),

  updateLeadStatus: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().uuid(),
      status: z.enum(LEAD_STATUSES),
      returnTo: z.string().optional(),
    }),
    handler: async ({ id, status, returnTo }) => {
      try {
        // Capture the prior status so the list can show a confirmation toast with
        // an undo path. (Core stays untouched/return-stable for its unit tests.)
        const before = db
          .select({ status: leads.status })
          .from(leads)
          .where(eq(leads.id, id))
          .get();
        updateLeadStatusCore(db, { id, status });
        // Only allow same-app paths back to the list; fall back to /leads.
        const safeReturnTo = returnTo?.startsWith('/leads') ? returnTo : '/leads';
        // Signal the one-shot toast + row flash, only when the status actually moved.
        if (before && before.status !== status) {
          const sep = safeReturnTo.includes('?') ? '&' : '?';
          const toast = new URLSearchParams({ changed: id, from: before.status, to: status });
          return { returnTo: `${safeReturnTo}${sep}${toast.toString()}` };
        }
        return { returnTo: safeReturnTo };
      } catch (err) {
        return toActionError(err);
      }
    },
  }),

  deleteLead: defineAction({
    accept: 'form',
    input: z.object({ id: z.string().uuid() }),
    handler: async (input) => {
      try {
        deleteLeadCore(db, input);
        return { success: true };
      } catch (err) {
        return toActionError(err);
      }
    },
  }),

  createActivity: defineAction({
    accept: 'form',
    input: z.object({
      leadId: z.string().uuid(),
      type: z.enum(ACTIVITY_TYPES),
      // datetime-local sends an ISO-ish string; coerce it to a Date.
      occurredAt: z.coerce.date(),
      subject: z.string().optional(),
      body: z.string().min(1, 'Inhalt ist erforderlich'),
    }),
    handler: async (input) => {
      try {
        const activity = createActivityCore(db, input);
        return { id: activity.id };
      } catch (err) {
        return toActionError(err);
      }
    },
  }),

  updateActivity: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().uuid(),
      type: z.enum(ACTIVITY_TYPES),
      // datetime-local sends an ISO-ish string; coerce it to a Date.
      occurredAt: z.coerce.date(),
      subject: z.string().optional(),
      body: z.string().min(1, 'Inhalt ist erforderlich'),
    }),
    handler: async (input) => {
      try {
        const activity = updateActivityCore(db, input);
        return { id: activity.id };
      } catch (err) {
        return toActionError(err);
      }
    },
  }),

  deleteActivity: defineAction({
    accept: 'form',
    input: z.object({ id: z.string().uuid() }),
    handler: async (input) => {
      try {
        deleteActivityCore(db, input);
        return { success: true };
      } catch (err) {
        return toActionError(err);
      }
    },
  }),

  // Runs the configured LLM over an inbound email and persists classification + draft.
  // Cancellation: @astrojs/node does not propagate a client disconnect to
  // request.signal, so a dropped fetch alone won't stop the LLM. Instead each run
  // registers an AbortController keyed by activity id; the `cancelAnalysis` action
  // (a separate request fired by the "Abbrechen" button) aborts it, which is wired
  // through to the provider's OpenAI calls. Single process / single user, so an
  // in-memory registry is sufficient (mirrors the db singleton).
  analyzeActivity: defineAction({
    accept: 'form',
    input: z.object({ id: z.string().uuid() }),
    handler: async ({ id }) => {
      // Supersede any prior in-flight run for the same activity.
      analysisAborters.get(id)?.abort();
      const controller = new AbortController();
      analysisAborters.set(id, controller);
      try {
        await analyzeActivityCore(db, { id }, controller.signal);
        return { success: true };
      } catch (err) {
        if (controller.signal.aborted) {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'Analyse abgebrochen' });
        }
        return toActionError(err);
      } finally {
        // Only clear if a newer run hasn't already replaced ours.
        if (analysisAborters.get(id) === controller) analysisAborters.delete(id);
      }
    },
  }),

  // Aborts an in-flight analyzeActivity run (see the registry note above). JSON-only:
  // it is invoked from client JS, never as a progressively-enhanced form.
  cancelAnalysis: defineAction({
    accept: 'json',
    input: z.object({ id: z.string().uuid() }),
    handler: async ({ id }) => {
      analysisAborters.get(id)?.abort();
      return { success: true };
    },
  }),

  importLeads: defineAction({
    // The CSV is parsed + mapped client-side; we receive ready-to-insert rows.
    // The input is intentionally lenient (rows are validated per-row below) so a
    // single malformed row — e.g. a junk email — is skipped and counted, never
    // aborting the whole import the way a strict array schema would.
    accept: 'json',
    input: z.array(z.record(z.string(), z.unknown())),
    handler: async (rows) => {
      let inserted = 0;
      let duplicates = 0;
      let invalid = 0;
      for (const raw of rows) {
        const parsed = importRow.safeParse(raw);
        if (!parsed.success) {
          invalid++;
          continue;
        }
        try {
          createLeadCore(db, parsed.data);
          inserted++;
        } catch (err) {
          if (err instanceof ConflictError) {
            duplicates++;
            continue;
          }
          return toActionError(err);
        }
      }
      return { inserted, duplicates, invalid };
    },
  }),
};
