import type { APIRoute } from 'astro';
import { db } from '~/db';
import { consumeToken } from '~/lib/auth/service';

/**
 * Magic-link click endpoint. Verifies + consumes the token, mints a session,
 * redirects to /today on success. Anything else -> back to /login with a
 * generic `?e=...` marker (no distinct wording per reason, to avoid leaking
 * whether the token was valid-but-expired, replayed, or forged).
 */
export const GET: APIRoute = async ({ request, redirect, session }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  if (!token) return redirect('/login?e=1', 303);

  // Bail before consuming the token if the session store is unavailable —
  // otherwise a session-infra hiccup burns a single-use link the user
  // cannot retry with.
  if (!session) return redirect('/login?e=1', 303);

  const result = consumeToken(db, token);
  if (!result.ok) return redirect('/login?e=1', 303);

  session.set('userId', result.userId);
  session.set('email', result.email);

  return redirect('/today', 303);
};
