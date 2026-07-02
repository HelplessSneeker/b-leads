import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { db } from '~/db';
import { requestLogin } from '~/lib/auth/service';

export const authActions = {
  /**
   * Request a magic-link. The response is intentionally uniform: allow-listed
   * and rejected addresses both come back as `sent: true`, so the response
   * cannot be used to enumerate users. Server-side we branch inside
   * requestLogin.
   */
  requestLogin: defineAction({
    accept: 'form',
    input: z.object({ email: z.string().email('Ungültige E-Mail') }),
    handler: async ({ email }) => {
      // Swallow infra failures so the response shape is identical for
      // allow-listed vs. rejected emails. Without this, a mail-provider
      // throw would surface as a 500 for allowed addresses only, giving
      // an attacker an enumeration oracle.
      try {
        await requestLogin(db, email);
      } catch (err) {
        console.error('[auth] requestLogin failed:', err);
      }
      return { sent: true };
    },
  }),
};
