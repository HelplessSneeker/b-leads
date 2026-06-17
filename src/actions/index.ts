import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { LEAD_STATUSES } from '~/db/schema';

// Phase 1 logic is implemented after scaffold review. The Zod input schemas are
// defined now so the wiring is in place; handler bodies are intentional stubs.

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
    handler: async (_input) => {
      // TODO(Phase 1): insert into leads, return new id.
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'createLead — TODO Phase 1',
      });
    },
  }),

  updateLead: defineAction({
    accept: 'form',
    input: leadInput.extend({ id: z.string().uuid() }),
    handler: async (_input) => {
      // TODO(Phase 1): update lead by id, bump updated_at.
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'updateLead — TODO Phase 1',
      });
    },
  }),

  deleteLead: defineAction({
    accept: 'form',
    input: z.object({ id: z.string().uuid() }),
    handler: async (_input) => {
      // TODO(Phase 1): delete lead by id (replies cascade).
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'deleteLead — TODO Phase 1',
      });
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
