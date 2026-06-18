import { eq } from 'drizzle-orm';
import { db } from './index';
import { activities, leads, type NewActivity, type NewLead } from './schema';

// Synthetic demo data for local development (no real data — the repo is public).
// 10 leads spread deliberately across all 6 statuses, sources, and field-fill
// combinations so every UI surface shows realistic content for a visual review:
// both /today sections (overdue follow-ups + stale contacts), every status pill,
// the full markdown range in the hero lead's notes, the "—" empty-field rendering,
// and all 7 activity-type badges (each appearing at least twice). Each lead's
// lastTouchAt is recomputed from its activities (the new source of truth).
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(now + d * 24 * 60 * 60 * 1000);

// Hero lead notes — exercises every element styled by `.notes-rendered`
// (h2/h3 headings, unordered + ordered lists, link, blockquote, bold, code span).
const heroNotes = `## Projekt-Kontext

Plant Migration der bestehenden Webseite von WordPress auf Astro. Aktuelle
Schmerzpunkte:

- Performance (LCP > 4s)
- Content-Team will Markdown statt Block-Editor
- SEO-Aufgaben werden zu viel manueller Aufwand

### Stack-Vorgaben

1. Astro Content Collections für Blog
2. Tailwind v4 (sind sie sich noch nicht sicher)
3. Hosting auf [Coolify](https://coolify.io) — eigene Instanz

> "Wenn der Relaunch reibungslos läuft, übernehmen wir die Wartung auch
> langfristig." — Lukas, im Erstgespräch.

**Budget-Indikation:** 12–15k netto, je nach Scope.
Code-Snippet aus dem aktuellen Setup: \`wp_query\` Calls verteilen sich
über ~30 Templates.`;

const demoLeads: NewLead[] = [
  // 1 — new, short notes, follow-up morgen, no activities (lastTouchAt stays null)
  {
    name: 'Jonas Brandl',
    email: 'jonas.brandl@example.com',
    company: 'Brandl Digital',
    role: 'Inhaber',
    source: 'outreach-wave-2',
    status: 'new',
    notes: 'Über LinkedIn-Post auf uns aufmerksam geworden. Noch nicht kontaktiert.',
    followUpAt: daysFromNow(1), // morgen
  },
  // 2 — new, completely bare: no company/role/notes/followUpAt → exercises "—" rendering
  {
    name: 'Elena Roth',
    email: 'elena.roth@example.net',
    source: 'kaltakquise',
    status: 'new',
  },
  // 3 — contacted, active (lastTouchAt 2 Tage), follow-up überfällig
  {
    name: 'Markus Huber',
    email: 'm.huber@example.com',
    company: 'Huber GmbH',
    role: 'CTO',
    source: 'outreach-wave-1',
    status: 'contacted',
    nextAction: 'Angebot nachfassen',
    notes: 'Erstkontakt gut gelaufen, wartet auf Details.',
    followUpAt: daysAgo(5), // überfällig
  },
  // 4 — contacted, stale (lastTouchAt 9 Tage, kein Follow-up) → /today Stale-Sektion
  {
    name: 'Anna Berger',
    email: 'anna.berger@example.com',
    company: 'Berger Studio',
    source: 'linkedin',
    status: 'contacted',
    nextAction: 'Erneut nachhaken',
    notes: 'Web-Relaunch geplant, **Astro** im Gespräch. Längere Funkstille.',
  },
  // 5 — replied, Follow-up heute
  {
    name: 'Sophie Klein',
    email: 'sophie@kleinlabs.io',
    company: 'Klein Labs',
    role: 'Product Lead',
    source: 'outreach-wave-2',
    status: 'replied',
    nextAction: 'Angebot schicken',
    notes: 'Interesse signalisiert, Budget noch offen.',
    followUpAt: daysFromNow(0), // heute
  },
  // 6 — replied, Follow-up überfällig
  {
    name: 'Daniel Pichler',
    email: 'd.pichler@example.org',
    company: 'Pichler & Partner',
    role: 'Marketingleiter',
    source: 'referral',
    status: 'replied',
    nextAction: 'Nochmal anrufen',
    notes: 'Hat geantwortet, dann nicht mehr gemeldet.',
    followUpAt: daysAgo(2), // überfällig
  },
  // 7 — HERO: qualified, voller Content für Read-View, Timeline & gerenderte Notes
  {
    name: 'Lukas Maier',
    email: 'lukas.maier@example.org',
    company: 'Maier & Co',
    role: 'Geschäftsführer',
    source: 'referral',
    status: 'qualified',
    nextAction: 'Angebot vorbereiten + Termin nächste Woche',
    notes: heroNotes,
    followUpAt: daysFromNow(5), // in 5 Tagen
  },
  // 8 — won, abgeschlossen, alte Activities, keine Wiedervorlage
  {
    name: 'Carina Steiner',
    email: 'carina.steiner@example.com',
    company: 'Steiner Handels GmbH',
    role: 'Geschäftsführerin',
    source: 'linkedin',
    status: 'won',
    nextAction: 'Onboarding abgeschlossen',
    notes: 'Auftrag erteilt, Projekt läuft. Wartungsvertrag in Aussicht.',
  },
  // 9 — lost, mit Begründung (company only, kein Role)
  {
    name: 'Petra Wagner',
    email: 'p.wagner@example.net',
    company: 'Wagner Consulting',
    source: 'outreach-wave-1',
    status: 'lost',
    notes: 'Budget für 2026 aufgebraucht — evtl. Q1 erneut versuchen.',
    followUpAt: daysFromNow(14), // in 2 Wochen
  },
  // 10 — lost, ohne Begründung
  {
    name: 'Florian Gruber',
    email: 'florian.gruber@example.net',
    company: 'Gruber Bau',
    role: 'Projektleiter',
    source: 'kaltakquise',
    status: 'lost',
    followUpAt: daysFromNow(30), // in einem Monat
  },
];

// Activities keyed by lead email — every ACTIVITY_TYPE appears at least twice for
// timeline-badge variety. Bodies are plain text (rendered with whitespace-pre-wrap,
// not markdown) but may be multi-line. The two "new" leads (Jonas, Elena) have none,
// so their lastTouchAt stays null and the "NULLS LAST" ordering is exercised.
const demoActivities: Record<string, Omit<NewActivity, 'leadId'>[]> = {
  // HERO — 8 activities over ~4 weeks, all 7 types + a 2nd email_received.
  'lukas.maier@example.org': [
    {
      type: 'linkedin_sent',
      body: 'Hallo Lukas, spannend was ihr bei Maier & Co macht — würde mich gerne vernetzen.',
      occurredAt: daysAgo(28),
    },
    {
      type: 'linkedin_received',
      body: 'Hi! Gerne. Schick mir gerne mehr Infos zu eurem Astro-Ansatz.',
      occurredAt: daysAgo(27),
    },
    {
      type: 'email_sent',
      subject: 'Kurze Vorstellung + Astro-Case-Study',
      body: 'Hallo Lukas,\n\nwie angekündigt eine kurze Vorstellung: Wir bauen schnelle, wartbare Webseiten mit Astro — gerade für Teams, die von WordPress weg wollen.\n\nIm Anhang eine Case-Study eines vergleichbaren Relaunches: LCP von 4,8s auf 1,2s, Content-Pflege jetzt über Markdown statt Block-Editor.\n\nLass uns gerne kurz telefonieren, dann zeige ich dir konkret, wie das bei euch aussehen könnte.\n\nBeste Grüße',
      occurredAt: daysAgo(25),
    },
    {
      type: 'email_received',
      subject: 'Re: Kurze Vorstellung',
      body: 'Klingt interessant, lass uns reden. Diese oder nächste Woche passt mir gut.',
      occurredAt: daysAgo(23),
    },
    {
      type: 'call',
      subject: 'Erstgespräch (25 Min)',
      body: 'Stichpunkte aus dem Call:\n- WordPress-Setup historisch gewachsen, ~30 Templates\n- Content-Team frustriert vom Block-Editor\n- SEO bisher viel Handarbeit\n- Budgetrahmen grob 12–15k, Timing Q3',
      occurredAt: daysAgo(20),
    },
    {
      type: 'meeting',
      subject: 'Discovery-Workshop vor Ort',
      body: 'Halbtägiger Workshop in München mit Lukas + Content-Lead + Entwickler.\n\nOutcome: Scope grob abgesteckt (Blog via Content Collections, Migration in zwei Phasen), Tailwind v4 als Option festgehalten, nächster Schritt ist ein konkretes Angebot.',
      occurredAt: daysAgo(12),
    },
    {
      type: 'note',
      body: 'Angebot in Vorbereitung, warte noch auf finale Klärung zum Hosting (Coolify-Instanz vs. Managed). Lukas wirkt entschlossen.',
      occurredAt: daysAgo(7),
    },
    {
      type: 'email_received',
      subject: 'Zusätzliche Fragen',
      body: 'Zwei Fragen noch vorab:\n1. Wie lange dauert die Migration der bestehenden Inhalte?\n2. Übernehmt ihr auch die laufende Wartung danach?',
      occurredAt: daysAgo(3),
    },
  ],
  // 3 — contacted, active: newest activity daysAgo(2)
  'm.huber@example.com': [
    {
      type: 'email_sent',
      subject: 'Kurze Frage zum Web-Relaunch',
      body: 'Hallo Markus, danke für das nette Erstgespräch — anbei wie besprochen die Eckdaten.',
      occurredAt: daysAgo(4),
    },
    {
      type: 'call',
      body: 'Kurz telefoniert (10 Min), Bedarf bestätigt, will Angebot sehen.',
      occurredAt: daysAgo(2),
    },
  ],
  // 4 — contacted, stale: newest activity daysAgo(9) → drives /today Stale-Sektion
  'anna.berger@example.com': [
    {
      type: 'email_sent',
      subject: 'Web-Relaunch — Idee',
      body: 'Hallo Anna, hier wie angekündigt ein paar Gedanken zum Relaunch.',
      occurredAt: daysAgo(11),
    },
    {
      type: 'linkedin_sent',
      body: 'Kurzes Follow-up zur E-Mail von letzter Woche.',
      occurredAt: daysAgo(9),
    },
  ],
  // 5 — replied: email_sent → email_received → note
  'sophie@kleinlabs.io': [
    {
      type: 'email_sent',
      subject: 'Vorstellung Klein Labs',
      body: 'Hallo Sophie, ich melde mich wegen eures geplanten Web-Projekts.',
      occurredAt: daysAgo(8),
    },
    {
      type: 'email_received',
      subject: 'Re: Vorstellung Klein Labs',
      body: 'Hi, klingt gut — schick uns gerne ein Angebot. Budget müssen wir intern noch klären.',
      occurredAt: daysAgo(6),
    },
    {
      type: 'note',
      body: 'Angebot vorbereiten, Budgetfrage offen lassen und Optionen anbieten.',
      occurredAt: daysAgo(4),
    },
  ],
  // 6 — replied: email_sent → email_received → follow-up email_sent
  'd.pichler@example.org': [
    {
      type: 'email_sent',
      subject: 'Anfrage Relaunch',
      body: 'Hallo Daniel, gerne stelle ich euch unsere Arbeitsweise kurz vor.',
      occurredAt: daysAgo(7),
    },
    {
      type: 'email_received',
      subject: 'Re: Anfrage Relaunch',
      body: 'Danke, das schauen wir uns an und melden uns.',
      occurredAt: daysAgo(5),
    },
    {
      type: 'email_sent',
      subject: 'Nachfass: Anfrage Relaunch',
      body: 'Hallo Daniel, nur ein kurzes Nachhaken — gibt es schon einen Stand?',
      occurredAt: daysAgo(3),
    },
  ],
  // 8 — won: 4 Activities über ~6 Wochen, älteste ~d50, neueste ~d30 (nicht in /today)
  'carina.steiner@example.com': [
    {
      type: 'linkedin_received',
      body: 'Hallo, wir suchen Unterstützung für einen Shop-Relaunch — habt ihr Kapazität?',
      occurredAt: daysAgo(50),
    },
    {
      type: 'meeting',
      subject: 'Anforderungs-Meeting',
      body: 'Online-Meeting, 60 Min. Anforderungen aufgenommen, Umfang grob geklärt.',
      occurredAt: daysAgo(44),
    },
    {
      type: 'email_sent',
      subject: 'Angebot Shop-Relaunch',
      body: 'Hallo Carina, anbei unser Angebot wie besprochen.',
      occurredAt: daysAgo(36),
    },
    {
      type: 'note',
      body: 'Auftrag erteilt! Projektstart abgestimmt, Kickoff terminiert.',
      occurredAt: daysAgo(30),
    },
  ],
  // 9 — lost: kurzer Kontakt, dann Notiz "kein Budget"
  'p.wagner@example.net': [
    {
      type: 'email_sent',
      subject: 'Angebot',
      body: 'Hallo Petra, anbei unser Angebot.',
      occurredAt: daysAgo(22),
    },
    {
      type: 'note',
      body: 'Budget für 2026 aufgebraucht — Q1 erneut versuchen.',
      occurredAt: daysAgo(18),
    },
  ],
  // 10 — lost: ohne Begründung, nur kurze Notiz
  'florian.gruber@example.net': [
    {
      type: 'note',
      body: 'Kein Interesse, hat sich nach Erstkontakt nicht mehr gemeldet.',
      occurredAt: daysAgo(15),
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
