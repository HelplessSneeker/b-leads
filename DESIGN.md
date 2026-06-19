---
name: b-leads
description: A dense, system-adaptive operator's console for one person's cold-outreach pipeline.
colors:
  # Base tokens are LIGHT mode (canonical for tooling). Dark-mode values are
  # documented per token in the Colors section and carried in the sidecar.
  # OKLCH is the source of truth for this project; Stitch's linter prefers hex
  # and will warn — that is accepted here.
  bg: "oklch(1 0 0)"
  surface: "oklch(0.975 0 0)"
  surface-sunken: "oklch(0.945 0 0)"
  border: "oklch(0.90 0 0)"
  ink: "oklch(0.24 0.012 245)"
  muted: "oklch(0.47 0.012 245)"
  accent: "oklch(0.50 0.17 245)"
  accent-text: "oklch(0.45 0.17 245)"
  status-new: "oklch(0.40 0 0)"
  status-contacted: "oklch(0.45 0.15 225)"
  status-replied: "oklch(0.45 0.18 295)"
  status-qualified: "oklch(0.46 0.12 72)"
  status-won: "oklch(0.43 0.13 150)"
  status-lost: "oklch(0.50 0.18 25)"
typography:
  page-title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  section:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 450
    lineHeight: 1.4
    letterSpacing: "normal"
    fontFeature: "\"tnum\" 1"
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.bg}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "oklch(0.45 0.17 245)"
    textColor: "{colors.bg}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  status-tag:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.status-new}"
    rounded: "{rounded.xs}"
    padding: "1px 6px"
    typography: "{typography.label}"
  table-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "6px 12px"
---

# Design System: b-leads

## 1. Overview

**Creative North Star: "The Operator's Console"**

b-leads is a single-person cockpit for running cold outreach. It is not a product
being sold; it is a workbench the operator returns to every day to scan the state
of every lead, act on the right ones, and never lose an overdue follow-up. The
whole system optimizes for one thing: **the operator reads dense information and
acts fast.** Density is the point, not a compromise. Chrome that does not speed the
scan is deleted.

The visual language is a quiet technical console: a flat, layered neutral surface;
proportional sans for labels and prose; and a **monospace data layer** that carries
everything scanned and compared down a column — dates, counts, emails, IDs,
follow-up dates. Color is rationed. The indigo accent appears only on interaction
(primary action, current selection, focus, links); the six semantic status hues
appear only on pipeline state. Nothing is colored for decoration. The system is
**system-adaptive**: a dark console for focused and evening sessions, a pure-white
data-desk for bright daytime work, switched on `prefers-color-scheme`.

This system explicitly rejects two things named in PRODUCT.md. It is **not a
generic SaaS dashboard** — no hero-metric cards, no gradient accents, no identical
icon-heading-text card grids, no marketing chrome on an internal tool. And it is
**not a heavy enterprise CRM** — density here means *clarity* density, never
cluttered toolbars, tabs-within-tabs, or everything-at-once panels that bury the
signal. It also rejects the toy direction (no playful rounded-everything, no
illustrations, no bounce).

**Key Characteristics:**
- Flat, tonally-layered neutral surface; depth by border and tone, not shadow.
- Monospace tabular numerals for all scanned/compared data.
- A single rationed indigo accent for interaction; six semantic hues for state.
- Tight density: 14px body, ~28px table rows, small squared status tags.
- Dual-mode (dark + light), adapting to ambient light.

## 2. Colors

A near-monochrome neutral surface with a single indigo interaction accent and a
fixed six-hue semantic status vocabulary. Saturation is reserved; the neutrals do
the structural work, color carries meaning only.

Every token has a **dark** and a **light** value. Light is the canonical base in
the frontmatter; dark values are listed here and in the sidecar. All values are
OKLCH.

### Primary
- **Console Indigo — accent** (light `oklch(0.50 0.17 245)` / dark `oklch(0.62 0.16 245)`):
  The only interaction color. Primary action buttons (filled, white text), the
  current selection, focus rings, and active nav. Reserved exclusively for
  interaction — it is **never** used to express pipeline state.
- **Console Indigo — text** (light `oklch(0.45 0.17 245)` / dark `oklch(0.80 0.13 245)`):
  The same hue tuned for text contrast: links and accent text on the surface.

### Neutral
- **Surface base / bg** (light `oklch(1 0 0)` pure white / dark `oklch(0.16 0 0)` near-black):
  The page. Pure white in light mode (no hidden warmth); a true neutral near-black
  in dark mode (chroma 0).
- **Surface** (light `oklch(0.975 0 0)` / dark `oklch(0.20 0 0)`): Raised panels, the
  table body, popovers.
- **Surface sunken** (light `oklch(0.945 0 0)` / dark `oklch(0.235 0 0)`): Table
  headers, toolbars, the inactive status-tag background.
- **Border** (light `oklch(0.90 0 0)` / dark `oklch(0.30 0 0)`): 1px hairlines and
  row dividers. The primary structural device.
- **Ink** (light `oklch(0.24 0.012 245)` / dark `oklch(0.93 0 0)`): Body text. Carries
  the faintest cool tint in light mode. ≥12:1 on bg.
- **Muted** (light `oklch(0.47 0.012 245)` / dark `oklch(0.68 0 0)`): Secondary text,
  placeholders, em-dashes for empty cells. Tuned to clear ≥4.5:1 on its surface —
  not a decorative light gray.

### Tertiary — Semantic status vocabulary
Six fixed hues, one per pipeline status. They appear **only** on status tags and
the follow-up cell, never as decoration. Values below are the tag *text* color;
the tag background is a pale tint of the same hue (light) or a ~14%-opacity tint
of the same hue (dark).

- **Neu / new** — neutral (`oklch(0.40 0 0)` light / `oklch(0.72 0 0)` dark).
- **Kontaktiert / contacted** — blue 225° (`oklch(0.45 0.15 225)` / `oklch(0.82 0.10 225)`).
- **Geantwortet / replied** — violet 295° (`oklch(0.45 0.18 295)` / `oklch(0.82 0.12 295)`).
- **Qualifiziert / qualified** — amber 72° (`oklch(0.46 0.12 72)` / `oklch(0.83 0.11 72)`).
- **Gewonnen / won** — green 150° (`oklch(0.43 0.13 150)` / `oklch(0.80 0.12 150)`).
- **Verloren / lost** — red 25° (`oklch(0.50 0.18 25)` / `oklch(0.78 0.15 25)`).

The **follow-up urgency** cell reuses two of these hues by meaning: overdue →
*lost red*, due-today → *qualified amber*, future → *muted*. Always paired with
font-weight 600, so urgency reads without relying on hue alone.

### Named Rules
**The Rationed Accent Rule.** Console Indigo is interaction, full stop. If it
appears on something the operator cannot click, focus, or select, it is wrong.
Target ≤10% of any screen.

**The Two Vocabularies Rule.** Interaction color (indigo) and state color (the six
status hues) are separate languages and never overlap. The accent is never a
status; a status hue is never an action. This is why contacted-blue (225°) sits
clearly off the indigo accent (245°) — they must never be mistaken for each other.

**The Meaning-Only Color Rule.** Neutrals carry all structure. A pixel is colored
only if the color *means* something (interaction or state). Decorative color is
forbidden.

## 3. Typography

**UI / Body Font:** IBM Plex Sans (fallback `system-ui, sans-serif`)
**Data / Mono Font:** IBM Plex Mono (fallback `ui-monospace, SFMono-Regular, Menlo, monospace`)

**Character:** One designed-together superfamily, paired on the proportional-vs-mono
contrast axis. Plex Sans is a precise, slightly technical grotesque — right for an
instrument, never corporate, never toy. Plex Mono is the console's voice: it carries
every value the operator scans and compares down a column, with tabular numerals so
digits align to the pixel. The mono *is* the signature of the system.

### Hierarchy
- **Page Title** (600, 1.5rem/24px, -0.01em): Page headers (`Leads`, `Heute`). The
  ceiling — this console does not shout. One per page.
- **Section** (600, 1.125rem/18px): Sub-section headers, dialog titles.
- **Title** (600, 0.9375rem/15px): Row-level emphasis, the lead name, card headers.
- **Body** (400, 0.875rem/14px, line-height 1.5): Default UI and prose text. Prose
  capped at 65–75ch; dense tables run wider.
- **Label** (600, 0.6875rem/11px, +0.05em, UPPERCASE): Table column headers and
  field labels only. The one place tracking-uppercase is allowed.
- **Data** (450, 0.8125rem/13px, `font-feature-settings: "tnum"`): IBM Plex Mono.
  Dates, times, counts, emails, IDs, follow-up dates — anything aligned in a column
  or compared between rows.

### Named Rules
**The Mono-for-Data Rule.** If a value is scanned down a column or compared between
rows (date, count, email, ID, currency), it is set in IBM Plex Mono with tabular
numerals. Prose and labels are Plex Sans. Mixing them — sans dates in a table, mono
prose — is forbidden.

**The Fixed-Scale Rule.** Type sizes are fixed rem, never fluid `clamp()`. The
operator views at a consistent DPI; a heading that shrinks in a panel reads worse,
not better.

## 4. Elevation

This is a **flat console**. Depth is conveyed by tonal layering (bg → surface →
surface-sunken) and 1px borders, not by shadow. Resting surfaces cast no shadow;
the structure reads through tone and hairline alone. This is what separates the
console from a SaaS dashboard, where everything floats on a soft drop-shadow.

### Shadow Vocabulary
Shadows exist for exactly one job: lifting a true overlay off the page so it reads
as temporarily above everything. Two tokens, nothing more.

- **overlay** (`box-shadow: 0 8px 24px -6px oklch(0 0 0 / 0.18)` light; `0 8px 24px -6px oklch(0 0 0 / 0.55)` dark): Dropdowns, popovers, dialogs, command palette.
- **focus-ring** (`box-shadow: 0 0 0 2px {bg}, 0 0 0 4px {accent}`): The keyboard
  focus indicator — load-bearing, since the console is keyboard-forward.

### Named Rules
**The Flat-Console Rule.** Resting surfaces are flat. A shadow on a card, a row, a
panel, or a button at rest is a bug. Shadows belong only to things floating *above*
the page (overlays) and to focus.

## 5. Components

Every interactive component ships all of: default, hover, focus-visible, active,
disabled. Half a component is not shipped.

### Buttons
- **Shape:** Lightly squared (3px radius). Compact padding (6px 12px). Plex Sans 600,
  15px.
- **Primary:** Filled Console Indigo, white text (white text holds on the saturated
  fill in both modes). Used for the one main action per view (`Neuer Lead`). Hover:
  darken the fill ~0.05 L. One primary per view, never two competing.
- **Secondary:** Surface fill, 1px border, ink text. The default for most actions
  (`CSV-Import`). Hover: surface-sunken.
- **Ghost:** Transparent, muted text, no border. Tertiary/inline actions. Hover:
  surface fill + ink text.
- **Focus (all):** 2px accent ring with a bg-colored gap (the focus-ring token).
- **Disabled:** 45% opacity, no pointer.

### Status Tags
The pipeline state indicator. **Replaces the old rounded-full pills** — a small,
squared *tag* reads as data, not as a marketing badge.
- **Shape:** 2px radius (`rounded.xs`), tight padding (1px 6px), Label type
  (11px/600/uppercase).
- **Light:** pale tint of the status hue as background + the saturated status hue as
  text.
- **Dark:** ~14%-opacity tint of the status hue as background + the bright status hue
  as text.
- **As a filter (the status stat row):** the same tag plus a mono count. Selected
  state = a 2px accent ring (Two Vocabularies Rule: selection is indigo, the tag's
  own hue stays its status color).

### Inputs / Fields / Select
- **Style:** bg fill, 1px border, 3px radius, 6px 10px padding, ink text, muted
  placeholder (placeholders clear 4.5:1 — never faint).
- **Focus:** border shifts to accent + the focus-ring. No glow.
- **Error:** border + helper text in *lost red*; message is specific, never just a
  red outline.
- **Disabled:** surface-sunken fill, muted text.

### Tables (the signature surface)
The lead list is the heart of the console. It is a real table, dense and scannable.
- **Container:** surface bg, 1px border, no shadow.
- **Header row:** surface-sunken bg, Label type (11px uppercase tracked), 1px bottom
  border.
- **Body rows:** ~28px tall (6px 12px cells), 1px divider between rows, last row
  borderless. Hover: surface-sunken. Name in Title type + accent-text on hover; all
  data columns (email, dates, counts) in Data (mono) type.
- **No zebra striping** — the hairline divider does the separation; stripes add noise.

### Follow-up Cell (signature)
The single most important at-a-glance signal. A mono date colored by urgency:
overdue = *lost red* + 600, due-today = *qualified amber* + 600, future = muted, none
= muted em-dash. Color is always backed by weight so urgency survives a colorblind
read.

### Navigation
- **Style:** Top bar, surface bg, 1px bottom border. Wordmark `b-leads` in Title
  weight. Links in Body type.
- **States:** default muted; hover ink; **active** = ink + 600 weight + a 2px accent
  underline (active is the only place nav touches the accent).

### Named Rules
**The One-Primary Rule.** Exactly one filled indigo button per view. Everything else
is secondary or ghost. Two primaries means neither is.

## 6. Do's and Don'ts

### Do:
- **Do** set every scanned/compared value (dates, counts, emails, IDs, follow-ups) in
  IBM Plex Mono with tabular numerals (`font-feature-settings: "tnum"`).
- **Do** keep Console Indigo for interaction only — primary action, selection, focus,
  active nav, links — at ≤10% of any screen.
- **Do** convey depth with tone (bg → surface → surface-sunken) and 1px borders;
  keep resting surfaces flat.
- **Do** pair every status/urgency color with weight or a text label, so state reads
  without relying on hue (colorblind-safe).
- **Do** keep body text at the ink end of the ramp; verify ≥4.5:1, including
  placeholders and muted secondary text.
- **Do** ship every interactive component with default, hover, focus-visible, active,
  and disabled states, and a visible accent focus ring (the console is keyboard-forward).
- **Do** honor `prefers-reduced-motion` with an instant/crossfade fallback; keep state
  transitions at 150–250ms.

### Don't:
- **Don't** build a **generic SaaS dashboard**: no hero-metric cards (big number +
  small label + gradient accent), no identical icon-heading-text card grids, no
  marketing chrome on this internal tool.
- **Don't** build a **heavy enterprise CRM**: no cluttered toolbars, tabs-within-tabs,
  or everything-at-once panels. Density must mean clarity, not noise.
- **Don't** go toy: no playful rounded-everything, illustrations, or bounce/elastic
  motion.
- **Don't** use the indigo accent to express pipeline state, and don't use a status
  hue for an action — the two vocabularies never overlap.
- **Don't** put shadows on resting cards, rows, panels, or buttons. Shadows are for
  overlays and focus only.
- **Don't** use `border-left`/`border-right` > 1px as a colored accent stripe; use a
  full border, a tint, or a leading status tag instead.
- **Don't** use gradient text, `background-clip: text`, or decorative glassmorphism.
- **Don't** set data in proportional sans or prose in mono; don't use fluid `clamp()`
  type sizes in this product UI.
- **Don't** revert to undifferentiated default-Tailwind gray (`bg-gray-50` /
  `text-gray-900` with no tokens) — that is the rejected starting point.
