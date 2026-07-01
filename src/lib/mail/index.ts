import { MockMailProvider } from './mock';
import type { MailProvider } from './provider';
import { SmtpMailProvider } from './smtp';

let cached: MailProvider | null = null;

/**
 * Lazily construct the mail provider from ENV. Cached per-process.
 * Reset with resetMailProvider() in tests; pass an override to inject a
 * provider stub without touching env vars.
 */
export function getMailProvider(): MailProvider {
  if (cached) return cached;
  const kind = (process.env.MAIL_PROVIDER ?? 'mock').toLowerCase();
  if (kind === 'smtp') {
    const portRaw = process.env.SMTP_PORT ?? '587';
    const port = Number.parseInt(portRaw, 10);
    cached = new SmtpMailProvider({
      host: process.env.SMTP_HOST ?? '',
      port: Number.isFinite(port) && port > 0 ? port : 587,
      secure: (process.env.SMTP_SECURE ?? '').toLowerCase() === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      fromEmail: process.env.AUTH_FROM_EMAIL ?? '',
      fromName: process.env.AUTH_FROM_NAME,
    });
  } else {
    cached = new MockMailProvider();
  }
  return cached;
}

export function resetMailProvider(override?: MailProvider): void {
  cached = override ?? null;
}

export type { MailMessage, MailProvider } from './provider';
