import { defineMiddleware } from 'astro:middleware';
import { runAuthPreflightOnce } from '~/lib/auth/preflight';

/**
 * Session guard. Every request needs a session-userId except:
 *   - /login (request form + POST action-return)
 *   - /auth/*   (magic-link verify endpoint, POST /auth/logout)
 *   - /_actions/auth.requestLogin (Astro Action endpoint, reachable while
 *     logged out for the magic-link request)
 *   - /_astro/*, /favicon.ico and other static prefixes served by Astro itself
 */
const PUBLIC_PREFIXES = ['/login', '/auth/', '/_astro/', '/_image', '/_server-islands/'];
const PUBLIC_PATHS = new Set(['/favicon.ico', '/robots.txt']);
const PUBLIC_ACTIONS = new Set(['requestLogin']);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  if (pathname.startsWith('/_actions/')) {
    const action = pathname.slice('/_actions/'.length).split(/[/?]/)[0];
    if (PUBLIC_ACTIONS.has(action)) return true;
  }
  return false;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  runAuthPreflightOnce();
  if (isPublic(ctx.url.pathname)) return next();

  const userId = await ctx.session?.get('userId');
  if (!userId) return ctx.redirect('/login', 303);

  ctx.locals.userId = userId;
  return next();
});
