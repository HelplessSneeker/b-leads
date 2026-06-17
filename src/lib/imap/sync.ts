// Phase 2: poll the configured IMAP mailbox and attach inbound replies to
// matching leads (by From address). Skeleton only — no implementation yet.
//
// import { ImapFlow } from 'imapflow';

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
}

/** Reads IMAP config from env. Returns null if not configured. */
export function getImapConfig(): ImapConfig | null {
  const { IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASSWORD, IMAP_TLS } = process.env;
  if (!IMAP_HOST || !IMAP_USER || !IMAP_PASSWORD) return null;
  return {
    host: IMAP_HOST,
    port: IMAP_PORT ? Number(IMAP_PORT) : 993,
    user: IMAP_USER,
    password: IMAP_PASSWORD,
    tls: IMAP_TLS !== 'false',
  };
}

/**
 * Polls the inbox for new messages and stores them as inbound replies.
 *
 * Phase 2 TODO:
 *  - connect with ImapFlow(getImapConfig())
 *  - fetch UNSEEN since last sync, parse From/Subject/Body
 *  - match sender to a lead by email, insert into `replies` (direction: inbound)
 *  - advance lead status new/contacted -> replied, set last_touch_at
 *  - mark processed; persist a sync cursor
 *
 * Cron hook: call this on an interval (e.g. node-cron or Coolify scheduled
 * task). Implementation lands in Phase 2.
 */
export async function syncInbox(): Promise<{ processed: number }> {
  throw new Error('syncInbox not implemented (Phase 2)');
}
