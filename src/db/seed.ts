import { db } from './index';
import { leads, type NewLead } from './schema';

/** Inserts a few demo leads for local development. Run via `pnpm db:seed`. */
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
  },
  {
    name: 'Markus Huber',
    email: 'm.huber@example.com',
    company: 'Huber GmbH',
    role: 'CTO',
    source: 'outreach-wave-1',
    status: 'replied',
    nextAction: 'Angebot schicken',
  },
  {
    name: 'Sophie Klein',
    email: 'sophie@kleinlabs.io',
    company: 'Klein Labs',
    role: 'Product Lead',
    source: 'referral',
    status: 'new',
  },
];

db.delete(leads).run();
const inserted = db.insert(leads).values(demoLeads).run();

console.log(`Seeded ${inserted.changes} leads.`);
