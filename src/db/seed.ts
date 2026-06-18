import { eq } from 'drizzle-orm';
import { db } from './index';
import { activities, leads, type NewActivity, type NewLead } from './schema';

// Synthetic demo data for local development (no real data — the repo is public).
// Covers several statuses so the list filter has something to work with, and a mix
// of activity types so the timeline + stats widgets show data. Each lead's
// lastTouchAt is recomputed from its activities (the new source of truth).
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(now + d * 24 * 60 * 60 * 1000);

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
    followUpAt: daysAgo(2), // überfällig
  },
  {
    name: 'Markus Huber',
    email: 'm.huber@example.com',
    company: 'Huber GmbH',
    role: 'CTO',
    source: 'outreach-wave-1',
    status: 'replied',
    nextAction: 'Angebot schicken',
    followUpAt: daysFromNow(0), // heute
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
    followUpAt: daysFromNow(3), // in 3 Tagen
  },
  {
    name: 'Petra Wagner',
    email: 'p.wagner@example.net',
    company: 'Wagner Consulting',
    role: 'Marketing',
    source: 'referral',
    status: 'lost',
    notes: 'Budget für dieses Jahr aufgebraucht.',
    followUpAt: daysFromNow(14), // in 2 Wochen
  },
];

// Activities keyed by lead email — at least one of every ACTIVITY_TYPE, spread
// across the demo leads. Sophie (status "new") intentionally has none, so her
// lastTouchAt stays null and the "NULLS LAST" ordering is exercised.
const demoActivities: Record<string, Omit<NewActivity, 'leadId'>[]> = {
  'anna.berger@example.com': [
    {
      type: 'email_sent',
      subject: 'Kurze Frage zum Web-Relaunch',
      body: 'Hallo Anna, …',
      occurredAt: daysAgo(4),
    },
    {
      type: 'email_received',
      subject: 'Re: Kurze Frage',
      body: 'Klingt spannend, erzähl mehr!',
      occurredAt: daysAgo(2),
    },
    { type: 'note', body: 'Bevorzugt Astro, Budget ~10k.', occurredAt: daysAgo(1) },
  ],
  'm.huber@example.com': [
    {
      type: 'linkedin_sent',
      body: 'Vernetzungsanfrage + kurze Vorstellung.',
      occurredAt: daysAgo(6),
    },
    { type: 'linkedin_received', body: 'Angenommen, gerne mehr Infos.', occurredAt: daysAgo(5) },
    {
      type: 'call',
      subject: 'Erstgespräch',
      body: '20 Min, Bedarf bestätigt.',
      occurredAt: daysAgo(2),
    },
  ],
  'lukas.maier@example.org': [
    {
      type: 'email_sent',
      subject: 'Terminvorschlag',
      body: 'Vorschlag für nächste Woche.',
      occurredAt: daysAgo(8),
    },
    {
      type: 'meeting',
      subject: 'Discovery-Meeting',
      body: 'Anforderungen aufgenommen.',
      occurredAt: daysAgo(5),
    },
  ],
  'p.wagner@example.net': [
    { type: 'email_sent', subject: 'Angebot', body: 'Angebot versendet.', occurredAt: daysAgo(20) },
    {
      type: 'note',
      body: 'Budget für dieses Jahr aufgebraucht — Q1 erneut versuchen.',
      occurredAt: daysAgo(14),
    },
  ],
};

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

// Attach activities + recompute lastTouchAt. Idempotent: a lead that already has
// activities is left untouched, so re-running the seed does not duplicate them.
let insertedActivities = 0;
for (const [email, items] of Object.entries(demoActivities)) {
  const lead = db.select().from(leads).where(eq(leads.email, email)).get();
  if (!lead) continue;

  const hasActivities = db.select().from(activities).where(eq(activities.leadId, lead.id)).get();
  if (hasActivities) continue;

  db.insert(activities)
    .values(items.map((a) => ({ ...a, leadId: lead.id })))
    .run();
  insertedActivities += items.length;

  const lastTouchAt = items.reduce<Date>(
    (max, a) => (a.occurredAt && a.occurredAt > max ? a.occurredAt : max),
    new Date(0),
  );
  db.update(leads).set({ lastTouchAt, updatedAt: new Date() }).where(eq(leads.id, lead.id)).run();
}
console.log(`seed: inserted ${insertedActivities} activities.`);
