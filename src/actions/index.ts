import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { db } from '~/db';
import { LEAD_STATUSES } from '~/db/schema';
import {
  ConflictError,
  createLead as createLeadCore,
  deleteLead as deleteLeadCore,
  NotFoundError,
  updateLead as updateLeadCore,
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
});

export const server = {
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

  importLeads: defineAction({
    accept: 'form',
    input: z.object({
      // CSV content + a JSON column mapping (header -> lead field).
      csv: z.string().min(1),
      mapping: z.string().min(1),
    }),
    handler: async (_input) => {
      // TODO(Phase 1): parse CSV (parseCsv), apply mapping, bulk insert.
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'importLeads — TODO Phase 1',
      });
    },
  }),
};
