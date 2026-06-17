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

db.delete(leads).run();
const inserted = db.insert(leads).values(demoLeads).run();

console.log(`Seeded ${inserted.changes} leads.`);
