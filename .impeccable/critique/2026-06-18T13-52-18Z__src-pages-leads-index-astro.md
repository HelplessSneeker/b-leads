---
target: leads list + console surfaces
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-06-18T13-52-18Z
slug: src-pages-leads-index-astro
---
# Critique — b-leads (leads list + console surfaces)

**Target:** `src/pages/leads/index.astro` and the surrounding console (Layout, `today.astro`, lead detail, forms, `LeadsFilter`). Re-run after the "harden console against edge cases" commit.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Inline status change submits + full-page PRG redirect with no "saved" confirmation and no loading affordance on the most-frequent action. |
| 2 | Match System / Real World | 4 | Status/activity vocabulary and "Wiedervorlage / Heute fällig" map cleanly to the operator's mental model. |
| 3 | User Control and Freedom | 2 | Delete is confirm-guarded and forms cancel, but the inline status `<select>` commits instantly with no undo; no bulk actions. |
| 4 | Consistency and Standards | 3 | Row-interaction model now unified across list + today (fixed); undercut by German UI mixed with English data labels. |
| 5 | Error Prevention | 3 | Duplicate-email conflict guard + CSV import disabled-until-valid are strong; status transitions ungated. |
| 6 | Recognition Rather Than Recall | 4 | Source datalist, auto-mapped CSV columns, repopulated forms, visible per-status counts — almost no recall demanded. |
| 7 | Flexibility and Efficiency | 1 | Claims "keyboard-forward" but ships zero accelerators — no `/`, `n`, `j`/`k`, no palette. The signature promise is unmet. |
| 8 | Aesthetic and Minimalist Design | 4 | Dense, flat, disciplined; the redundant second filter row is gone. Exemplary for the brief. |
| 9 | Error Recovery | 3 | Conflict message with a direct link to the existing lead is excellent; generic "Import fehlgeschlagen" is vague. |
| 10 | Help and Documentation | 2 | List empty states now teach; `/today` + activities still only report absence; no shortcut hints. |
| **Total** | | **28/40** | **Good — same number as last run, but the composition shifted: visual/consistency fixes landed, interaction-depth gaps are now the ceiling.** |

## Anti-Patterns Verdict

**Does this look AI-generated? No — the opposite of slop.** A committed, internally-coherent system executed with unusual discipline: rationed 245° indigo for interaction only, six semantic status hues kept deliberately off that hue, the mono `.data` layer with tabular numerals on every scanned column, squared status tags (not pills), flat tonal layering with no decorative shadow, a real focus ring on every control, and a full `prefers-reduced-motion` reset. The comments explain *why* (PRG rationale, Vienna-timezone edge cases, the off-indigo status hue). None of the absolute bans appear.

**Deterministic scan:** `detect.mjs --json` over `src/pages`, `src/components`, `src/layouts` returned `[]` — clean, zero findings. No side-stripe borders, gradient text, glassmorphism, eyebrow scaffolding, or hero-metric template.

**Contrast (reasoned from OKLCH tokens):** body `--muted` (L 0.47) clears AA on its surfaces; status-tag foregrounds (L 0.43–0.5 on L~0.95 tints) are comfortably AA; the due-today/overdue follow-up colors pass and are paired with weight. The one genuine failure is the breadcrumb `/` separator at `text-border` (L 0.90 on L 1.0 bg ≈ ~1.1:1) — effectively invisible.

**Browser overlay:** Not available — no browser-automation tool in this environment, so no user-visible overlay was injected. Findings are from source + the CLI detector.

## Overall Impression

This reads like a tool, not a demo — exactly the brief, and it has improved since the last run. The redundant filter row is gone, the two tables now share one row model, and the list empty state distinguishes "no leads yet" from "no match." The score didn't move off 28, but the *reason* did: the visual and consistency problems are largely solved, and what now caps the experience is interaction depth. The two things the operator does most — navigate fast and change state confidently — are still the two weakest spots. Close the keyboard gap and give the status change a confirmation, and this jumps a band.

## What's Working

- **A real, rationed design system, executed with discipline.** The 245° interaction accent vs. the six off-hue status colors, the consistent mono+tabular `.data` layer, squared tags, flat layering — and the dark-mode token set is fully thought through (tints become alpha overlays, accent-text lightens to L 0.8 for legibility on dark). This is the strongest thing here.
- **State/data hygiene that surfaces as UX quality.** PRG redirects everywhere prevent resubmit-on-reload; the duplicate-email conflict hands you a direct link to the existing lead; CSV import auto-maps German/English headers with diacritic folding and stays disabled until valid.
- **Correct triage defaults.** The app lands on `/today`; follow-up urgency is color-coded by Vienna calendar day (amber today, red overdue) with the timezone edge handled honestly. It opens on the right screen showing the right thing.

## Prior Issues — Current Status

1. **[P1] Redundant stacked status filters — FIXED.** `LeadsFilter.tsx` now owns only the search input; status filtering lives solely in the stat row (`index.astro` 96–120), each card an `<a>` that both shows the count and toggles the filter with `aria-current`. One control, dual-purpose.
2. **[P2] No keyboard shortcuts — STILL PRESENT.** No global keydown handler in `Layout.astro`; the only key handling is Enter-to-flush in `LeadsFilter.tsx`. The brand's core promise remains unmet. (Now elevated to P1.)
3. **[P2] Two row-interaction models — FIXED.** `today.astro` dropped the whole-row `onclick` and the "→ zum Lead" column; both tables now link only the name cell, matching the list.
4. **[P2] Silent/irreversible inline status change — PARTIAL.** PRG redirect preserves filters (good plumbing), but still no "gespeichert" confirmation and no undo. (Elevated to P1.)
5. **[P2] Empty states report absence — PARTIAL.** Fixed on the list (no-match vs. never-had-leads, with the right action each). `today.astro` ("Nichts zu tun") and `ActivityTimeline` ("Noch keine Aktivitäten") still only report absence.
6. **Minor cluster — PARTIAL.** Breadcrumb separator STILL invisible. Mixed-language labels STILL present ("Last Touch", "Next Action", "Stale Follow-ups", "Tage seit Last Touch"). `aria-pressed`-on-link FIXED (now `aria-current` on `<a>`).

## Priority Issues

### [P1] "Keyboard-forward" is unimplemented
The brand's core promise. `Layout.astro` has no keydown handler; nothing responds to `/`, `n`, `j`/`k`, or a palette. For the only user — a power user living in this tool daily — every action is mouse-to-target.
- **Why it matters:** Speed is listed as a feature and the focus ring is built for keyboard use, but the accelerators that would make it a console instead of a web form don't exist. This single gap anchors heuristic #7 at 1.
- **Fix:** Add a global keydown layer — `/` focuses search, `n` → `/leads/new`, `j`/`k` move row selection with Enter to open, `g t`/`g l` navigate, `?` shows a shortcut sheet. Invisible to the mouse path.
- **Suggested command:** `/impeccable harden`

### [P1] Inline status change gives no confirmation and no undo
The most-repeated action on the signature surface completes silently: `onchange="this.form.requestSubmit()"` → server mutation → PRG redirect that just reloads the page in place. A misclick on the dropdown silently advances a lead's pipeline state.
- **Why it matters:** Status is meaningful state. Silent, un-undoable mutation on the highest-traffic surface invites quiet data drift the operator won't notice, and leaves a "did that take?" flicker on every change during a triage session.
- **Fix:** On the post-redirect render show a transient "Status → X gespeichert" toast (reuse the CsvImport toast pattern, `role="status"` aria-live), ideally with an "Rückgängig" link that re-POSTs the prior status. At minimum, briefly highlight the changed row.
- **Suggested command:** `/impeccable animate`

### [P2] Breadcrumb separator is invisible (~1.1:1)
The `/` separators in `index.astro`, `new.astro`, and `edit.astro` use `text-border` (L 0.90 on L 1.0 bg). Sighted and low-vision users lose the path structure.
- **Why it matters:** It's the one token-level contrast failure in an otherwise carefully-verified system; non-text but load-bearing for orientation.
- **Fix:** Switch the separators to `text-muted` (L 0.47, ~4.8:1), or render a styled `::before` chevron.
- **Suggested command:** `/impeccable polish`

### [P2] Mixed-language labels break the "German UI" claim
"Last Touch" (list, detail, today), "Next Action" (list, detail, new), "Stale Follow-ups" / "Tage seit Last Touch" (today) sit beside German headers.
- **Why it matters:** Two vocabularies for column/field labels add micro-cognitive-load and undercut the consistency the "earned familiarity" principle is meant to deliver.
- **Fix:** Translate the data labels consistently — "Letzter Kontakt", "Nächste Aktion", "Inaktiv 7+ Tage". Apply everywhere they appear.
- **Suggested command:** `/impeccable clarify`

### [P3] `/today` and activities empty states still only report absence
Now that the list teaches, "Nichts zu tun" (`today.astro` 64) and "Noch keine Aktivitäten" (`ActivityTimeline`) read as inconsistent dead-ends.
- **Why it matters:** Lower stakes than the list, but the inconsistency is now visible.
- **Fix:** Give "Nichts zu tun" a quiet link to `/leads`; hint that the form above logs the first activity.
- **Suggested command:** `/impeccable onboard`

## Persona Red Flags

**Alex (power user — the actual, only user):** Reaches for the keyboard daily and finds nothing — no `/`, no `n`, no row navigation, no palette. No bulk operations: can't multi-select stale leads to re-status; each is one dropdown that reloads the whole page with no confirmation. No sort controls (fixed lastTouch DESC). Fast, but not as fast as the brief promises — death by a thousand silent reloads during triage.

**Sam (accessibility / keyboard):** Well served on focus and motion — the global `:focus-visible` ring (2px accent halo with a bg gap) is genuinely well done, on every interactive element, and `prefers-reduced-motion` is fully honored. Poorly served on operability: the breadcrumb `/` is below any WCAG threshold; with no list navigation shortcuts, keyboard users Tab through every interactive cell. The delete `confirm()` and aria-labels on icon-only controls are correct.

## Minor Observations

- `onwheel="event.preventDefault()"` on the status select prevents accidental scroll-wheel status changes — a deliberate, good touch.
- **Deployment wart:** `Layout.astro` (the one git-modified file) carries an injected `<script src="http://localhost:8400/live.js">` between `impeccable-live-start/end` markers — a leftover from an `/impeccable live` session. It must not ship to the Tailscale deployment; remove it (or run `/impeccable live` cleanup) before deploy.
- `daysSince` renders a follow-up due today as red "0" in the "Tage überfällig" column — consider "heute" instead of "0".
- Email column correctly uses `.data` mono; names stay sans. Good discipline maintained.
