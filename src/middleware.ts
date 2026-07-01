import { defineMiddleware } from 'astro:middleware';

/**
 * Session guard. Every request needs a session-userId except:
 *   - /login (request form + POST action-return)
 *   - /auth/*   (magic-link verify endpoint)
 *   - /_actions/auth.* (Astro Action endpoints for requestLogin / logout —
 *     logout runs on an authenticated request, but Astro serves the action
 *     under /_actions, and we want requestLogin reachable while logged out)
 *   - /_astro/*, /favicon.ico and other static prefixes served by Astro itself
 */
const PUBLIC_PREFIXES = ['/login', '/auth/', '/_astro/', '/_image', '/_server-islands/'];
const PUBLIC_PATHS = new Set(['/favicon.ico', '/robots.txt']);
const PUBLIC_ACTIONS = new Set(['requestLogin', 'logout']);

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
  if (isPublic(ctx.url.pathname)) return next();

  const userId = await ctx.session?.get('userId');
  if (!userId) return ctx.redirect('/login', 303);

  ctx.locals.userId = userId;
  return next();
});
