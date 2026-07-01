import { BrevoMailProvider } from './brevo';
import { MockMailProvider } from './mock';
import type { MailProvider } from './provider';

let cached: MailProvider | null = null;

/**
 * Lazily construct the mail provider from ENV. Cached per-process.
 * Reset with resetMailProvider() in tests when env vars change.
 */
export function getMailProvider(): MailProvider {
  if (cached) return cached;
  const kind = (process.env.MAIL_PROVIDER ?? 'mock').toLowerCase();
  if (kind === 'brevo') {
    cached = new BrevoMailProvider({
      apiKey: process.env.BREVO_API_KEY ?? '',
      fromEmail: process.env.AUTH_FROM_EMAIL ?? '',
      fromName: process.env.AUTH_FROM_NAME,
    });
  } else {
    cached = new MockMailProvider();
  }
  return cached;
}

export function resetMailProvider(): void {
  cached = null;
}

export type { MailMessage, MailProvider } from './provider';
