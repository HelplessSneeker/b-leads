# b-leads

Lead-Tracking-/CRM-Tool für eigenen Cold-Outreach. Single-user, läuft
Tailscale-only auf einem Personal Server (Coolify) — **keine Auth im Code**.

## Stack

- **Astro 6** (Actions + Sessions, `output: 'server'`, `@astrojs/node` standalone)
- **React Islands** für interaktive UI (Tabellen-Filter, Lead-Detail)
- **Tailwind 4** (via `@tailwindcss/vite`)
- **SQLite + Drizzle ORM** (better-sqlite3), Migrations via drizzle-kit
- **Vitest** (Tests), **Biome** (Lint + Format), **pnpm**
- TypeScript strict

## Setup

Benötigt Node ≥ 22 und pnpm.

```bash
pnpm install          # Dependencies (better-sqlite3 wird nativ gebaut)
cp .env.example .env  # ENV anpassen (Default LLM_PROVIDER=mock)
pnpm db:generate      # Migration aus dem Schema generieren (bei Schema-Änderung)
pnpm db:migrate       # Migrationen auf die SQLite-DB anwenden
pnpm db:seed          # optional: Demo-Leads einspielen
pnpm dev              # Dev-Server (http://localhost:4321)
```

> Hinweis: Die native better-sqlite3-Binary wird beim `pnpm install`
> kompiliert (Approval in `pnpm-workspace.yaml` → `allowBuilds`). Build-Tools
> (python3, make, g++) müssen vorhanden sein.

## Dev-Befehle

| Befehl             | Zweck                                            |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | Dev-Server                                       |
| `pnpm build`       | Production-Build (Node-Server)                   |
| `pnpm preview`     | Production-Build lokal starten                   |
| `pnpm db:generate` | Drizzle-Migration aus `src/db/schema.ts`         |
| `pnpm db:migrate`  | Migrationen anwenden                             |
| `pnpm db:seed`     | Demo-Leads einspielen                            |
| `pnpm test`        | Vitest (einmalig)                                |
| `pnpm test:watch`  | Vitest im Watch-Modus                            |
| `pnpm lint`        | Biome Lint + Format-Check                        |
| `pnpm format`      | Biome Format (schreibend)                        |
| `pnpm check`       | `astro check` + Biome                            |

## Projektstruktur

```
src/
  actions/        Astro Actions (Lead-CRUD, CSV-Import) — Zod-validiert
  components/     React Islands (z.B. LeadsFilter)
  db/             Drizzle-Schema, Client, Migrate-Runner, Seed
  layouts/        Layout.astro
  lib/
    llm/          LLMProvider-Abstraktion (mock | ollama | mistral)
    imap/         IMAP-Inbox-Sync (Phase 2)
    csv.ts        CSV-Parsing (papaparse)
    markdown.ts   Markdown-Rendering (marked)
    date.ts       Datum-Formatierung (dd.MM.yyyy HH:mm, Europe/Vienna)
  pages/          Routen (/, /leads, /leads/new, /leads/import, /leads/[id])
  styles/         global.css (Tailwind)
drizzle/          Generierte SQL-Migrationen
data/             SQLite-DB (gitignored)
```

## Datenmodell

- **leads** — id, name, email (unique), company?, role?, source, status
  (`new | contacted | replied | qualified | won | lost`), next_action?,
  last_touch_at?, notes? (Markdown), created_at, updated_at
- **replies** — id, lead_id (FK, cascade), direction (`inbound | outbound`),
  subject, body, received_at?/sent_at?, llm_classification? (JSON), llm_draft?,
  created_at

## ENV

Siehe [`.env.example`](./.env.example). Phase 1 braucht nur `DB_PATH` und
`LLM_PROVIDER=mock`. IMAP- und LLM-Provider-Variablen sind für Phase 2/3
dokumentiert (auskommentiert).

## Phasen-Roadmap

- **Phase 1 (aktuell):** Lead-CRUD manuell, CSV-Import. Kein LLM, kein IMAP.
- **Phase 2:** IMAP-Poll der Mailbox, eingehende Replies an Leads anhängen.
- **Phase 3:** LLM-Klassifikation + Reply-Draft (Triage) — mock → ollama/mistral.
- **Phase 4:** Dashboard (überfällig, Pipeline, Funnel).

Stand jetzt: **Scaffold** (Phase 1) + Skelette für Phase 2/3. Die CRUD-/Import-
Logik und die UI-Detailseiten werden auf dem Gerüst implementiert.
