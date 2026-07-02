import type { MailMessage, MailProvider } from './provider';

/**
 * Dev mail provider — logs the mail. Magic links appear in the server log,
 * which is enough to complete the flow locally without Brevo.
 */
export class MockMailProvider implements MailProvider {
  async send(msg: MailMessage): Promise<void> {
    console.log(`[mail:mock] to=${msg.to} subject=${msg.subject}\n${msg.text}`);
  }
}
