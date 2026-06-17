import { db } from './index';
import { leads, type NewLead } from './schema';

// Synthetic demo leads for local development (no real data — the repo is public).
// Covers several statuses so the list filter has something to work with. Touched
// leads get a lastTouchAt so the "NULLS LAST" ordering and the detail page show data.
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);

const demoLeads: NewLead[] = [
  {
    name: 'Anna Berger',
    email: 'anna.berger@example.com',
    company: 'Berger Studio',
    role: 'Founder',
    source: 'outreach-wave-1',
    status: 'contacted',
    nextAction: 'Follow-up in 3 Tagen',
    notes: '# Notiz\n\nWeb-Relaunch geplant, **Astro** im Gespräch.',
    lastTouchAt: daysAgo(1),
  },
  {
    name: 'Markus Huber',
    email: 'm.huber@example.com',
    company: 'Huber GmbH',
    role: 'CTO',
    source: 'outreach-wave-1',
    status: 'replied',
    nextAction: 'Angebot schicken',
    lastTouchAt: daysAgo(2),
  },
  {
    name: 'Sophie Klein',
    email: 'sophie@kleinlabs.io',
    company: 'Klein Labs',
    role: 'Product Lead',
    source: 'referral',
    status: 'new',
  },
  {
    name: 'Lukas Maier',
    email: 'lukas.maier@example.org',
    company: 'Maier & Co',
    role: 'Geschäftsführer',
    source: 'linkedin',
    status: 'qualified',
    nextAction: 'Termin vereinbaren',
    lastTouchAt: daysAgo(5),
  },
  {
    name: 'Petra Wagner',
    email: 'p.wagner@example.net',
    company: 'Wagner Consulting',
    role: 'Marketing',
    source: 'referral',
    status: 'lost',
    notes: 'Budget für dieses Jahr aufgebraucht.',
    lastTouchAt: daysAgo(14),
  },
];

// Never run against a production database — a stray `pnpm db:seed` there would
// either wipe real outreach data (--reset) or pollute it with demo rows.
if (process.env.NODE_ENV === 'production') {
  console.error('seed: refusing to run with NODE_ENV=production');
  process.exit(1);
}

// Opt-in destructive reset (old behavior). Default is idempotent: existing leads
// (matched by unique email) are left untouched, only new demo rows are inserted.
const reset = process.argv.includes('--reset');
if (reset) {
  console.warn('seed: --reset → deleting all existing leads');
  db.delete(leads).run();
}

const result = db
  .insert(leads)
  .values(demoLeads)
  .onConflictDoNothing({ target: leads.email })
  .run();
const skipped = demoLeads.length - result.changes;
console.log(`seed: inserted ${result.changes} leads (skipped ${skipped} existing).`);
