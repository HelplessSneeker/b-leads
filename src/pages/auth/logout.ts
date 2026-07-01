import type { APIRoute } from 'astro';

/**
 * Session-Logout mit server-side Redirect nach /login.
 *
 * Bewusst als plain POST-Endpoint statt Astro Action: die Redirect-Response
 * wird vom ClientRouter für view-transitions korrekt gefolgt und der Browser
 * landet ohne Session-Cookie auf /login. Als Action mit Return-Value wäre der
 * Redirect nur über den Referer-PRG-Weg gelaufen — abhängig vom Referer und
 * anfällig für Client-Side-Swap-Bugs, bei denen die Page nach Cookie-Clear
 * nicht neu rendert.
 */
export const POST: APIRoute = ({ session, redirect }) => {
  session?.destroy();
  return redirect('/login', 303);
};
