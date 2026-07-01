# b-leads

Lead-Tracking-/CRM-Tool für eigenen Cold-Outreach. Läuft Tailscale-only auf
einem Personal Server (Coolify). Multi-User via Magic-Link + Email-Allowlist
(siehe [Auth](#auth) unten).

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
| `pnpm db:seed`     | Demo-Leads einspielen (idempotent; `--reset` löscht vorher) |
| `pnpm test`        | Vitest (einmalig)                                |
| `pnpm test:watch`  | Vitest im Watch-Modus                            |
| `pnpm lint`        | Biome Lint + Format-Check                        |
| `pnpm format`      | Biome Format (schreibend)                        |
| `pnpm check`       | `astro check` + Biome                            |

> `pnpm db:seed` ist Default idempotent (existierende Emails werden übersprungen).
> `pnpm db:seed --reset` löscht vorher alle Leads. Mit `NODE_ENV=production`
> verweigert das Script den Lauf.

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
- **users** — id, email (unique), created_at, last_login_at?
- **auth_tokens** — id, token_hash (unique), email, expires_at, consumed_at?,
  created_at

## Auth

Magic-Link + Email-Allowlist. Nur Adressen, die in `AUTH_ALLOWLIST` stehen,
können einen Login-Link anfordern; alle anderen Requests werden still
verworfen (keine Enumeration). Der Link ist HMAC-signiert
(`AUTH_TOKEN_SECRET`, ≥ 32 Byte), single-use (Hash in `auth_tokens`) und
TTL-begrenzt (`AUTH_TOKEN_TTL_MINUTES`, default 15 Minuten). Nach Klick
setzt `/auth/verify` eine Astro-Session und leitet auf `/today`. Alles
außer `/login`, `/auth/*` und den `requestLogin`/`logout`-Actions ist per
Middleware (`src/middleware.ts`) geschützt.

Mail-Versand: `MAIL_PROVIDER=mock` (Dev — Link im Server-Log) oder `brevo`
(HTTP-API, benötigt `BREVO_API_KEY` + `AUTH_FROM_EMAIL`).

## ENV

Siehe [`.env.example`](./.env.example). Phase 1 braucht `DB_PATH`,
`LLM_PROVIDER=mock` sowie die Auth-Variablen (`AUTH_ALLOWLIST`,
`AUTH_TOKEN_SECRET`, `APP_BASE_URL`, `MAIL_PROVIDER`). IMAP- und
LLM-Provider-Variablen sind für Phase 2/3 dokumentiert (auskommentiert).

## Phasen-Roadmap

- **Phase 1 (aktuell):** Lead-CRUD manuell, CSV-Import. Kein LLM, kein IMAP.
- **Phase 2:** IMAP-Poll der Mailbox, eingehende Replies an Leads anhängen.
- **Phase 3:** LLM-Klassifikation + Reply-Draft (Triage) — mock → ollama/mistral.
- **Phase 4:** Dashboard (überfällig, Pipeline, Funnel).

Stand jetzt: **Scaffold** (Phase 1) + Skelette für Phase 2/3. Die CRUD-/Import-
Logik und die UI-Detailseiten werden auf dem Gerüst implementiert.
