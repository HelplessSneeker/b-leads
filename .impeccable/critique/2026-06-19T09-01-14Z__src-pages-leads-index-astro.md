---
target: leads list (re-run)
total_score: 32
p0_count: 0
p1_count: 1
timestamp: 2026-06-19T09-01-14Z
slug: src-pages-leads-index-astro
---
# Critique — b-leads (leads list, re-run)

**Target:** `src/pages/leads/index.astro` and its console surround (Layout nav, CommandPalette, LeadsFilter). Re-run after the keyboard layer + status toast/undo landed.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Status toast + one-shot row-flash are excellent; but no pending/loading affordance during the full-page PRG round-trip on status change or search-navigate. |
| 2 | Match System / Real World | 4 | On this page every header is German (Name, Firma, Wiedervorlage, Nächste Aktion); pipeline vocabulary maps cleanly to the operator's model. |
| 3 | User Control and Freedom | 3 | Undo on status change now exists (toast Rückgängig) — big win — but it auto-dismisses at 6s and the inline `<select>` still commits instantly. |
| 4 | Consistency and Standards | 3 | Strong token/control system; undercut by the inline `<select>` using ad-hoc classes + `text-xs` (12px) instead of the documented `.field` vocabulary. |
| 5 | Error Prevention | 2 | The auto-submit-on-change `<select>` is an accidental-mutation trap; `onwheel preventDefault` only half-closes the hazard. The one sub-par score. |
| 6 | Recognition Rather Than Recall | 3 | ⌘K is visible with a kbd hint and the `?` sheet lists every binding — but j/k row-nav and the `g`-chords are pure recall; nothing on the table signals it's navigable. |
| 7 | Flexibility and Efficiency | 4 | Was 1 last run. Now genuinely a console: palette, go-to chords, j/k row nav, debounced search, filter-as-URL. The signature promise is met. |
| 8 | Aesthetic and Minimalist Design | 4 | High data-ink ratio, flat tonal layering, no chrome. Exemplary for the brief. |
| 9 | Error Recovery | 3 | Undo path + empty-filter reset link are good; a mis-set status found after the toast dismisses requires re-finding the row. |
| 10 | Help and Documentation | 3 | The `?` keyboard sheet is better than most tools ship; it just isn't advertised where a first session would see it. |
| **Total** | | **32/40** | **Good — up from 28. The two prior P1s (no keyboard, silent status change) are resolved; error-prevention on the inline select is now the ceiling.** |

## Anti-Patterns Verdict

**Does this look AI-generated? No — the opposite of slop.** A committed, internally-coherent system: rationed 245° indigo for interaction only, six semantic status hues kept off that hue, the mono `.data` layer with tabular numerals on every scanned column, squared tags (not pills), flat tonal layering with no decorative shadow, a real focus ring on every control, full `prefers-reduced-motion` reset. A Linear/Raycast/Stripe-fluent user would trust it.

**Deterministic scan:** `detect.mjs --json` over the four surfaces returned 2 **advisory** findings, both in the new `CommandPalette.astro` and both defensible: the modal backdrop scrim `oklch(0 0 0 / 0.4)` (line 133) and the palette panel `border-radius: 6px` (line 156, the rounded scale tops out at md=4px). The page itself (`index.astro`) is clean — no side-stripe borders, gradient text, glassmorphism, eyebrow scaffolding, or hero-metric template.

**Browser overlay:** Not available — no browser-automation tool in this environment, so no user-visible overlay was injected. Findings are from source + the CLI detector + reasoned OKLCH contrast.

## Overall Impression

This jumped a real notch since the last run. The keyboard layer the brand kept *promising* now exists (palette, chords, j/k row nav), and the status change went from silent mutation to a flash + toast + undo — a genuinely Linear-grade micro-moment. What now caps it is a single hazard the rest of the system is too careful to deserve: a passive, scroll-reachable, auto-committing status `<select>` sitting in a dense scan-table, where one stray interaction silently rewrites the product's primary signal. Close that and the contrast/responsive nits, and this is a 35+ tool.

## What's Working

- **URL-as-single-source-of-truth filtering.** `LeadsFilter.tsx` rewrites `?status=&q=` and the server re-renders — no client/server divergence, fully shareable/reloadable, and the status PRG (`index.astro:11-16`) means a reload never re-submits a mutation. Architecturally correct and rare.
- **Two-vocabularies color discipline, executed.** Indigo = interaction (active-filter ring, nav underline, focus); the six status hues = state, never crossed. The active stat keeps its status hue *and* gains a `ring-accent` (`index.astro:120-127`) — exactly the documented rule. linkedin tags even moved off indigo onto violet to protect it.
- **The status-change moment.** Inline change → row flashes indigo once → toast slides in showing `Neu → Kontaktiert` as two real tags with an undo. State/urgency are encoded by weight + label, not color alone, so it survives a colorblind read.

## Priority Issues

### [P1] Auto-submitting inline `<select>` is an accidental-mutation trap
`index.astro:210-216`: `onchange="this.form.requestSubmit()"`. A keyboard user arrowing a focused select, a mobile native picker, or a stray click mutates pipeline state with no confirm. `onwheel="event.preventDefault()"` shows the author saw the scroll-trap but only half-closed it. This is also a WCAG 3.2.2 (On Input) concern.
- **Why it matters:** Pipeline status is the product's primary signal; silent wrong mutations erode trust in the at-a-glance state, and the undo that would catch them auto-dismisses at 6s.
- **Fix:** Make undo durable (don't auto-dismiss, or persist a thin undo bar), and/or move status change behind an explicit apply or the palette (select row → `s` → pick) so it can't be fired passively. At minimum, keep the toast dismiss-only.
- **Suggested command:** `/impeccable harden`

### [P2] The power model is discoverable only by recall
j/k, Enter, `g t`/`g l`, `/`, `n`, `i`, `:` are invisible until the user already knows to press `?`. Only ⌘K is advertised, and nothing on the table reveals rows are keyboard-navigable.
- **Why it matters:** The entire "fast operator's console" value prop is locked behind undiscoverable keys; a returning operator who hasn't memorized them gets a slower tool than the one that was built.
- **Fix:** Surface a persistent low-key hint (a `? Kürzel` affordance in the nav or a one-line list footer), and hint row-nav on the table (subtle `j/k` cue on the header or first row).
- **Suggested command:** `/impeccable onboard`

### [P2] Row selection and scroll position are lost on every status change
A status change does a full PRG redirect (`index.astro:14-16`); `resolveRows` re-runs with `rowIndex = -1` (`CommandPalette.astro:563`). The operator's place in the list resets on every mutation — friction in exactly the rapid batch-triage loop the product exists for.
- **Why it matters:** "Clear a batch of replies fast" is the core job; resetting position after each clear taxes it directly.
- **Fix:** Preserve scroll/selection across the round-trip (restore the active row from the `changed` id, or scroll it into view), or move the status mutation to an in-place update that doesn't reload.
- **Suggested command:** `/impeccable harden`

### [P3] Muted text contrast is marginal on `surface`/`surface-sunken` (light mode)
Light `--muted: oklch(0.47)` sits on `surface` cells and the 11px uppercase header sits on `surface-sunken: oklch(0.945)` (`index.astro:168, 197`), pushing the Firma / Letzter-Kontakt / Nächste-Aktion columns and the headers toward or under 4.5:1 — the exact gray-on-gray density trap DESIGN.md warns about. Dark mode is fine.
- **Why it matters:** These muted columns are scanned data at 11-13px; sub-AA contrast there is the failure the brief explicitly calls out.
- **Fix:** Darken light `--muted` to ~`oklch(0.44)`, or verify each muted-on-surface pairing at 4.5:1 and adjust the header background.
- **Suggested command:** `/impeccable audit`

### [P3] 7-column table + hidden scrollbar conceals the signature cell on mobile
`index.astro:166` wraps the table in `overflow-x-auto scrollbar-none`; on a narrow viewport columns 4-7 overflow but the scrollbar is hidden (`global.css:472-477`), so the cue that columns continue offscreen is gone — including the follow-up urgency cell DESIGN.md calls the signature signal.
- **Why it matters:** The owner may triage from a phone over Tailscale; the single most important at-a-glance signal is the easiest to lose.
- **Fix:** Keep horizontal scroll discoverable on touch (don't hide that scrollbar / add an edge fade), or collapse to a stacked / priority-column layout below ~640px.
- **Suggested command:** `/impeccable adapt`

## Persona Red Flags

**Alex (power user — the actual, only user):** Will fat-finger the auto-submitting select while moving fast; undo helps for only 6s. j/k selection resets after every status change (full reload), so place-in-list is lost mid-triage. The `g`-chord has a 600ms timeout (`CommandPalette.astro:493`) a fast typist may exceed, silently dropping `g l`. No bulk re-status of stale leads.

**Sam (accessibility / keyboard):** The row-nav/chord layer is undiscoverable without the unannounced `?`. Row navigation moves a *visual* `data-nav-active` highlight but does **not** move DOM focus (`setRow`, `CommandPalette.astro:537-545`), so a screen reader announces nothing — it's a sighted-keyboard affordance only. The auto-submitting status `<select>` is hostile to arrowing through options. The 6s toast may dismiss before AT reaches the undo. Focus ring + reduced-motion handling remain excellent.

**Daily solo operator (project persona):** Core loop is "open → see what needs action today → clear it," but `/leads` leads with *all* leads and nothing nudges toward the `/today` triage view (even the empty state links only to new/import). The signature follow-up-urgency cell is column 6 of 7 — behind the hidden horizontal scroll on mobile. Losing list position on every status change taxes the batch-clear workflow.

## Minor Observations

- Inline `<select>` (`index.astro:215`) uses ad-hoc classes instead of `.field`, and `text-xs` (12px) is below the documented 14px field size — a small vocabulary drift on the one control that mutates state.
- Undo re-POSTs `updateLeadStatus`, which fires its own "Status aktualisiert" toast — the revert's confirmation could read as "did it fail?" Consider distinct copy for a revert.
- Detector drift, both advisory and both legitimate: backdrop scrim color and the 6px palette radius. Either document them in DESIGN.md (an "overlay" radius token) or pull the panel to `md`/4px.
- `aria-label` on the stat filters is rich and correct (count + active state). Nicely done.
- Stat-row counts at `text-xl` mono flirt with the "hero number" look the brief rejects; the tag label above keeps them reading as data for now — watch it if counts grow.

## Questions to Consider

1. Should the inline `<select>` exist at all? With a palette and a detail page already present, a passive auto-committing status mutator in a scan-table is the one affordance fighting the "trust the data" brand. Would `select row → s → pick status` be safer *and* more on-brand?
2. Is `/leads` the right daily home, or a reference view? PRODUCT.md's success metric points at `/today`; should the list's first-run/empty states route the operator there?
3. Does hiding scrollbars serve density or vanity, when on touch it conceals the existence of the signature follow-up cell?
