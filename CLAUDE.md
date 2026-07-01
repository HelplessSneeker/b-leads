# CLAUDE.md — b-leads

Kontext für AI-Assistenten (Claude Code, Codex, o.ä.) in diesem Repo.
Menschen: README.md + PRODUCT.md + DESIGN.md.

## Stack (Kurz)

Astro 6 (server output, `@astrojs/node` standalone) + React Islands +
Tailwind 4 + SQLite/Drizzle + Vitest + Biome. Single-user, Tailscale-only,
keine Auth im Code. Node ≥ 22.

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

## Was NICHT tun

- Kein UI-Feinschliff (Typografie, Color-Tokens, Motion, Spacing) im
  Implement-Modus. Das ist eine separate Design-Karte.
- Keine Merges in `dev` oder `main` — auch nicht bei grünem CI.
- Kein Auth-/Session-Code hinzufügen. Repo läuft Tailscale-only per
  Design.
