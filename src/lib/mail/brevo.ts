import type { MailMessage, MailProvider } from './provider';

/**
 * Brevo transactional email via HTTP API (no SDK — one fetch call).
 *
 * https://developers.brevo.com/reference/sendtransacemail
 */
export class BrevoMailProvider implements MailProvider {
  private readonly apiKey: string;
  private readonly from: { email: string; name?: string };

  constructor(opts: { apiKey: string; fromEmail: string; fromName?: string }) {
    if (!opts.apiKey) throw new Error('BrevoMailProvider: apiKey is required');
    if (!opts.fromEmail) throw new Error('BrevoMailProvider: fromEmail is required');
    this.apiKey = opts.apiKey;
    this.from = { email: opts.fromEmail, name: opts.fromName };
  }

  async send(msg: MailMessage): Promise<void> {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: this.from,
        to: [{ email: msg.to }],
        subject: msg.subject,
        textContent: msg.text,
        htmlContent: msg.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo send failed: ${res.status} ${body}`);
    }
  }
}
