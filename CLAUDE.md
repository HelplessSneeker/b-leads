# CLAUDE.md — b-leads

Kontext für AI-Assistenten (Claude Code, Codex, o.ä.) in diesem Repo.
Menschen: README.md + PRODUCT.md + DESIGN.md.

## Stack (Kurz)

Astro 6 (server output, `@astrojs/node` standalone) + React Islands +
Tailwind 4 + SQLite/Drizzle + Vitest + Biome. Multi-user via Magic-Link +
Email-Allowlist (`src/lib/auth/`, `src/middleware.ts`), Tailscale-only
Deploy. Node ≥ 22.

Details: `README.md`.

## Branch-Flow

- Base-Branch für Feature-Arbeit: **`dev`**. Nie direkt in `main`.
- Branch-Prefixe aus `dev`: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- PRs gegen `dev`. Merge macht bfn nach manuellem Test.
- Kein Force-Push auf `dev` oder `main`, kein `--no-verify`,
  kein `--no-gpg-sign`.

## Commits

Conventional Commits: `feat(scope):`, `fix(scope):`, `chore(scope):`.
Scopes typisch: `llm`, `db`, `ui`, `import`, `biome`, `deps`.

Kein `--amend` auf gepushte Commits. Neue Commits statt History-Rewrite.

## Dev-Loop

```bash
CI=true pnpm install           # non-TTY-Shells brauchen CI=true
pnpm dev                       # http://localhost:4321
pnpm test                      # Vitest
pnpm check                     # astro check + biome
```

`CI=true` ist Pflicht für pnpm-Ops in Shells ohne TTY (agents, CI-Runner),
sonst aborted es defensiv beim `node_modules`-Rebuild.

## Quality Gates vor PR

Alle drei müssen grün sein:

1. `pnpm test` — Vitest
2. `pnpm check` — `astro check` + `biome check`
3. Manueller Smoketest der geänderten Route/Aktion (Dev-Server)

Rote Tests, die vor der eigenen Änderung schon rot waren, nicht
eigenmächtig fixen — im PR-Body flaggen.

## Scope-Grenzen für Feature-Karten

Vor Arbeitsbeginn Block-Back an bfn, wenn:

- \> 3 neue Routes/Pages **oder** > 2 neue Domain-Entities
- Schema-Migration nötig (`drizzle` — Migration muss reviewt sein)
- Neue Runtime-Dependency (security-Reviewed vor `pnpm add`)
- Breaking Change an: API/Action-Contract, ENV-Var, Public-Component-Props,
  DB-Schema, Build/Deploy-Verhalten

## LLM-Provider-Abstraktion

`LLMProvider`-Interface (`src/llm/`) mit Impls `mock`, `ollama`.
`LLM_PROVIDER` in `.env` schaltet. Neue Provider gegen dasselbe Interface —
Call-Sites bleiben provider-agnostisch.

## Auth

Magic-Link + Email-Allowlist. Nur Adressen aus `AUTH_ALLOWLIST` können einen
Link anfordern; alles andere wird still verworfen (kein User-Enumeration-
Signal). Tokens sind HMAC-signiert (`AUTH_TOKEN_SECRET`), single-use
(SHA-256-Hash in `auth_tokens`), TTL default 15 Minuten. Session via Astro
Sessions (`fsLite` Driver aus `@astrojs/node`), Middleware in
`src/middleware.ts` schützt alles außer `/login`, `/auth/*` und der
`requestLogin`-Action (Logout ist ein POST-Endpoint unter `/auth/logout`
mit server-side Redirect nach `/login`). Mail via
`MAIL_PROVIDER=mock|smtp` — `mock` loggt den Link, `smtp` versendet über
nodemailer (SMTP_HOST/PORT/USER/PASS). Provider-agnostisch, konfigurier-
bar für Brevo, Postmark, Mailgun, SendGrid oder eigenes Relay.

## Was NICHT tun

- Kein UI-Feinschliff (Typografie, Color-Tokens, Motion, Spacing) im
  Implement-Modus. Das ist eine separate Design-Karte.
- Keine Merges in `dev` oder `main` — auch nicht bei grünem CI.
