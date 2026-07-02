import nodemailer, { type Transporter } from 'nodemailer';
import type { MailMessage, MailProvider } from './provider';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  fromEmail: string;
  fromName?: string;
}

/**
 * Generic SMTP mail provider via nodemailer. Works with any transactional
 * mail service that speaks SMTP — Brevo, Postmark, Mailgun, SendGrid, or a
 * self-hosted relay. Provider-agnostic on purpose so `MAIL_PROVIDER=smtp`
 * covers all of them via `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`.
 */
export class SmtpMailProvider implements MailProvider {
  private readonly config: SmtpConfig;
  private transporter: Transporter | null = null;

  constructor(config: SmtpConfig) {
    if (!config.host) throw new Error('SmtpMailProvider: SMTP_HOST is required');
    if (!config.fromEmail) throw new Error('SmtpMailProvider: AUTH_FROM_EMAIL is required');
    this.config = config;
  }

  async send(msg: MailMessage): Promise<void> {
    const t = this.getTransporter();
    const from = this.config.fromName
      ? `"${this.config.fromName}" <${this.config.fromEmail}>`
      : this.config.fromEmail;
    await t.sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth:
        this.config.user && this.config.pass
          ? { user: this.config.user, pass: this.config.pass }
          : undefined,
    });
    return this.transporter;
  }
}
