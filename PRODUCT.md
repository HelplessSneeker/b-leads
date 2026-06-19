# Product

## Register

product

## Users

A single user: the owner, running their own cold-outreach pipeline. Self-hosted
on a personal server (Coolify), reachable Tailscale-only — there is no auth in
the code and there are no other accounts. The user is technical and fluent in
power tools; this is *their* tool, used daily to triage replies, advance leads
through the pipeline, and decide who to follow up with next. The job to be done:
see the state of every lead at a glance, act on the right ones quickly, and
never lose track of an overdue follow-up.

## Product Purpose

b-leads is a lead-tracking / lightweight CRM for one person's cold outreach. It
replaces a spreadsheet: manual lead CRUD, CSV import, a status pipeline
(`new → contacted → replied → qualified → won → lost`), follow-up dates, and an
activity timeline per lead. Roadmap layers on top of this skeleton: IMAP inbox
sync to attach inbound replies (Phase 2), LLM classification + reply drafts for
triage (Phase 3), and a dashboard surfacing overdue items, pipeline, and funnel
(Phase 4). Success = the user opens it, instantly knows what needs action today,
and clears it faster than a spreadsheet would allow — no friction, no chrome
between them and the data.

## Brand Personality

A power tool, not a product demo. Three words: **dense, precise, fast.** It
reads like a TUI / terminal client — high data-ink ratio, monospace for the
things that are scanned and compared (IDs, dates, counts, emails), compact rows,
keyboard-forward. Confident and quiet: it trusts the user to read dense
information and gets out of the way. Tasteful polish is welcome (state
transitions, hover feedback, well-judged micro-interactions) but never
decorative — every pixel earns its place by serving the scan.

## Anti-references

- **Generic SaaS dashboard.** No hero-metric cards, no gradient accents, no
  identical icon-heading-text card grids, no marketing chrome on an internal
  tool. This is not a product someone is being sold; it's a workbench.
- **Heavy enterprise CRM** (Salesforce / HubSpot). Density is the goal, but
  *clarity* density, not clutter — no cluttered toolbars, tabs-within-tabs, or
  everything-at-once panels that bury the signal.
- Avoid the toy/over-designed direction too: no playful rounded everything,
  illustrations, or bounce/elastic motion.

## Design Principles

1. **Data-ink over chrome.** Every element justifies itself by serving the
   scan. Strip borders, padding, and decoration that don't help the user read
   the data faster. When in doubt, remove it.
2. **Scannable by alignment and type.** Monospace and tabular numerals for the
   things that are compared down a column (dates, counts, emails, IDs); a clean
   sans for prose and labels. Alignment does the work a card border would.
3. **The right lead at a glance.** Overdue / due-today / future follow-ups,
   pipeline state, and last-touch must be legible without clicking. Status and
   urgency are encoded in color and weight, used sparingly so they actually pop.
4. **Speed is a feature.** Fast, subtle state feedback (150–250ms); no page-load
   choreography, no waiting for animation. Keyboard-forward where it pays off.
5. **Earned familiarity.** Standard affordances done well — one button shape,
   one form-control vocabulary, one icon style across every screen. The tool
   disappears into the task.

## Accessibility & Inclusion

Target WCAG AA for the things that matter at this density: body text ≥4.5:1
against its surface (the trap with dense gray-on-gray tables — keep body text
toward the ink end), large/secondary text ≥3:1, and visible focus rings on
every interactive control (the tool is keyboard-forward, so focus state is
load-bearing, not optional). Motion polish is welcome but must honor
`prefers-reduced-motion` with a crossfade/instant fallback. Status/urgency must
never be carried by color alone — pair it with a label, weight, or icon so the
pipeline reads without relying on hue.
