---
target: leads list + console surfaces
total_score: 28
p0_count: 0
p1_count: 1
timestamp: 2026-06-18T13-01-09Z
slug: src-pages-leads-index-astro
---
# Critique — b-leads (leads list + console surfaces)

**Target:** `src/pages/leads/index.astro` and the surrounding console (Layout, `today.astro`, lead detail, forms, `LeadsFilter`).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Inline status change relies on a full PRG reload as its only confirmation; no explicit "saved" / optimistic state. |
| 2 | Match System / Real World | 3 | Strong German domain language, but English leaks ("Last Touch", "Next Action", "Stale Follow-ups") mix vocabularies. |
| 3 | User Control and Freedom | 3 | Deletes confirm and forms have cancel, but the inline status `<select>` commits instantly with no undo. |
| 4 | Consistency and Standards | 3 | Excellent token discipline, undercut by duplicate status-filter controls and two different row-interaction models. |
| 5 | Error Prevention | 3 | Delete confirm + duplicate-email conflict guard are strong; instant status commit is ungated. |
| 6 | Recognition Rather Than Recall | 3 | Everything labeled, source datalist, visible nav; no surfaced shortcuts. |
| 7 | Flexibility and Efficiency | 2 | Zero keyboard shortcuts despite the "keyboard-forward" self-claim — no palette, no row nav, no quick-new. |
| 8 | Aesthetic and Minimalist Design | 3 | Genuinely disciplined data-ink; the one blemish is the redundant second row of status chips. |
| 9 | Error Recovery | 3 | Conflict message with a direct link to the existing lead is excellent; field errors are specific and repopulate. |
| 10 | Help and Documentation | 2 | Import page explains itself; otherwise none (acceptable for a single-user self-built tool). |
| **Total** | | **28/40** | **Good — solid foundation, address the weak interaction/consistency areas.** |

## Anti-Patterns Verdict

**Does this look AI-generated? No.** This is the opposite of slop. It is a committed, internally-coherent system that follows its own DESIGN.md with unusual discipline: rationed indigo accent, the mono data layer with tabular numerals, squared status tags (not pills), flat tonal layering with no decorative shadow, a real focus ring on every control, and a `prefers-reduced-motion` reset. None of the absolute bans appear.

**Deterministic scan:** `detect.mjs` over `src/pages`, `src/components`, `src/layouts` returned `[]` — **clean, zero findings**. No side-stripe borders, no gradient text, no glassmorphism, no eyebrow scaffolding, no hero-metric template.

**Contrast (verified numerically, not assumed):** `--muted` lands at 12–17:1 across its surfaces; the inactive filter tags hold ≥5.2:1 even at `opacity-70`. The single warned-about trap (gray-on-tinted) is genuinely avoided. The only sub-threshold value is the decorative breadcrumb `/` separator at 1.94:1 (non-text, low stakes).

**Browser overlay:** Not available. The dev server at `:4321` is up but returns HTTP 500 on `/leads` (likely an un-migrated/un-seeded DB), so no reliable user-visible overlay was injected. Findings are from source + the CLI detector.

## Overall Impression

This already reads like a tool, not a demo — which is exactly the brief. The craft is real and the system is honest to itself. The biggest opportunity is **not** visual; it's that the page has two controls doing the same job, and that the tool claims to be keyboard-forward but isn't yet. Fix the duplication and earn the keyboard claim, and this jumps a full band.

## What's Working

- **The data layer is the signature, and it lands.** Mono + `tabular-nums` on every scanned column, dates colored by urgency *and* backed by weight, em-dash for empties. Columns actually align down the page; the scan works.
- **Error recovery on the new-lead form is better than most production apps.** A duplicate email doesn't just reject — it looks up the existing record and hands you a direct link to open it. That's the kind of detail that makes a daily tool feel trustworthy.
- **The token system is doing the work.** One CSS variable layer, dark mode via `prefers-color-scheme` with no rebuild, the two-vocabularies rule (indigo = interaction, six hues = state) held consistently across tags, follow-up cells, and nav.

## Priority Issues

### [P1] Two separate status-filter controls stacked on the leads list
The status stat row (six clickable count cards, each with an active ring) and the `LeadsFilter` island's six status toggle buttons (also with an active ring) are **the same control twice**, one above the other. A user sees two rows of the same six status chips and has to learn that they do the identical thing. It's also the one place the design violates its own minimalism standard (heuristic 8: "no irrelevant or redundant information").
- **Why it matters:** Redundant controls raise cognitive load on the most-used screen and create a "which one do I click?" hesitation every visit. Two ring-states can also read as two independent filters.
- **Fix:** Pick one. The stat row already filters *and* shows counts — make it the canonical filter and drop the status buttons from the island, leaving the island as just the search box. Or invert it: keep the island's pills and make the stat row a non-interactive count summary. One affordance per job.
- **Suggested command:** `/impeccable distill`

### [P2] "Keyboard-forward" is claimed but not delivered
PRODUCT.md and DESIGN.md both lean on keyboard-forward operation, and the focus ring is built for it — but there are no actual accelerators: no command palette, no `j`/`k` row navigation, no shortcut to "Neuer Lead", no `/` to focus search, no Esc conventions documented. For a tool the owner opens every day, this is the gap between "looks like a TUI" and "works like one."
- **Why it matters:** The power user (the only user) is promised speed and gets mouse-driven navigation. Speed is listed as a feature; right now it's aspirational.
- **Fix:** Add a small shortcut layer — `/` focuses search, `n` opens new lead, `j`/`k` move row selection with Enter to open, `?` shows a shortcut sheet. Keep it invisible to the mouse path.
- **Suggested command:** `/impeccable harden`

### [P2] Two different row-interaction models between the two tables
On the leads list, only the **name** is a link; the rest of the row is inert. On `today.astro`, the **whole row** is clickable via `onclick` *and* there's a redundant "→ zum Lead" link in a trailing column. Same visual table component, two different click contracts — plus the `onclick` row isn't keyboard-focusable (the trailing link rescues keyboard users, but then the column is redundant for mouse users).
- **Why it matters:** Inconsistent interaction is the exact thing the "earned familiarity" principle is meant to prevent; users re-learn the table per page.
- **Fix:** Standardize one model. Make the whole row a navigable target on both (a proper link wrapping or a focusable row with keydown handling), then drop the redundant "→ zum Lead" column on `today`.
- **Suggested command:** `/impeccable polish`

### [P2] Inline status change is instant, silent, and irreversible
Changing a row's status `<select>` fires `requestSubmit()` on change → server mutation → PRG redirect. There's no confirmation that it saved (beyond the page reloading) and no undo. A stray scroll is guarded (`onwheel` preventDefault — nice), but a misclick on the dropdown silently advances a lead's pipeline state.
- **Why it matters:** Status is meaningful state. Silent, un-undoable mutation on the highest-traffic surface invites quiet data drift the operator won't notice.
- **Fix:** Add lightweight feedback (a brief row flash / "Status aktualisiert" affordance after the redirect) and consider an undo path, or at minimum keep the changed row in view and visibly re-rendered with its new tag.
- **Suggested command:** `/impeccable animate`

### [P2] Empty states report absence instead of teaching the next step
"Keine Leads gefunden." and "Nichts zu tun" are correct for the *filtered* case, but the zero-leads-ever state shows the same dead-end text with no path forward. The product reference is explicit: empty states should teach the interface, not say "nothing here."
- **Why it matters:** First run / freshly-cleared pipeline is exactly when a nudge ("Neuer Lead" / "CSV-Import") has the most value.
- **Fix:** Distinguish "no leads exist yet" (offer the two creation actions inline) from "no leads match this filter" (offer "Filter zurücksetzen").
- **Suggested command:** `/impeccable onboard`

## Persona Red Flags

**Alex (Power User — the actual user):** Opens the tool daily and immediately reaches for the keyboard — finds nothing. No `/` to search, no `n` for new lead, no row navigation, no palette. Has to mouse to the status stat row, then notices a *second* identical row of status chips below and pauses. Bulk actions (advance several stale leads at once) don't exist — it's one dropdown per row. Fast, but not as fast as the brief promises.

**Sam (Accessibility / keyboard-only):** Focus rings are present and load-bearing — good. But the `today` rows use `onclick` on a non-focusable `<tr>` (saved only by the trailing link), and the stat-row cards carry `aria-pressed` on an `<a>`, which isn't a valid state for a link role — a screen reader may mis-announce or ignore the pressed state. Status/urgency is correctly paired with weight, except overdue (red) vs due-today (amber) share the same medium weight in the same column, so the two urgent states differ by hue alone for a red/amber-confusable reader (the date value disambiguates on a careful read).

**The Operator (project-specific — single owner, triaging replies fast):** The detail page's conflict-link and inline activity timeline serve this person well. But the daily loop — open "Heute", clear the due list — is mouse-bound, and advancing a status gives no reassurance it stuck. The two things they do most (navigate fast, change state confidently) are the two weakest spots.

## Minor Observations

- Breadcrumb `/` separator uses `text-border` (~1.94:1) — nearly invisible. Decorative, low stakes, but `text-muted` would make it legible without shouting.
- `today.astro` has a redundant "→ zum Lead" column whose job duplicates the whole-row click (see P2).
- Mixed-language labels ("Last Touch", "Next Action", "Stale Follow-ups", "Next Action" in the detail `<dl>`) sit beside German headers. Pick one register for column/field labels.
- The six status stat cards at `min-w-[7rem]` flirt with the "stat card" look the brief rejects; they're saved by being real filter controls with counts, but consolidating per P1 also removes any ambiguity.

## Questions to Consider

- If the stat row already filters and counts, what is the island's status row *for*? What would the page lose if it were just a search box?
- The brief says "keyboard-forward." What does the 30-second morning loop look like without touching the mouse — and does the current build support it?
- When you advance a lead's status from the list, how do you currently know it worked? Should you have to trust a page reload?
