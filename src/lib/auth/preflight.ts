let ran = false;

/**
 * Dev-only Boot-Warnung wenn Auth/Mail-ENVs unvollständig sind. Ohne diesen
 * Check kippen alle Login-Requests silent ins Allowlist-Gate oder werfen
 * spät im `sendMail`-Pfad — beides ist bei fehlgeschlagenem `.env`-Laden
 * unnötig schwer zu diagnostizieren.
 *
 * Runs einmal beim ersten Middleware-Hit. Prod bleibt still.
 */
export function runAuthPreflightOnce(): void {
  if (ran) return;
  ran = true;
  if (!import.meta.env.DEV) return;

  const problems: string[] = [];

  if (!process.env.AUTH_ALLOWLIST?.trim()) {
    problems.push('AUTH_ALLOWLIST leer — jeder Login wird silent rejected.');
  }

  const secret = process.env.AUTH_TOKEN_SECRET ?? '';
  if (secret.length < 32) {
    problems.push(
      `AUTH_TOKEN_SECRET ist ${secret.length} Byte lang, mindestens 32 nötig — Token-Issuance wirft.`,
    );
  }

  const provider = (process.env.MAIL_PROVIDER ?? 'mock').toLowerCase();
  if (provider === 'smtp') {
    if (!process.env.SMTP_HOST) problems.push('MAIL_PROVIDER=smtp gesetzt, aber SMTP_HOST leer.');
    if (!process.env.AUTH_FROM_EMAIL) {
      problems.push('MAIL_PROVIDER=smtp gesetzt, aber AUTH_FROM_EMAIL leer.');
    }
  } else if (provider !== 'mock') {
    problems.push(`MAIL_PROVIDER='${provider}' ist unbekannt — nutze 'mock' oder 'smtp'.`);
  }

  if (problems.length === 0) return;

  console.warn('\n[auth:preflight] Konfigurations-Warnungen:');
  for (const p of problems) console.warn(`  - ${p}`);
  console.warn('  Siehe .env.example für Referenz.\n');
}
