// @ts-check
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// On-demand server rendering is required for Astro Actions + Sessions.
// Deployed on Coolify behind Tailscale; magic-link auth + email allowlist
// gate the app (see src/lib/auth/, src/middleware.ts).
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  // Session cookie config. The @astrojs/node adapter provides the fsLite
  // driver by default; 30-day TTL, re-issued on each /auth/verify.
  session: {
    cookie: {
      name: 'b_leads_session',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
    ttl: 60 * 60 * 24 * 30,
  },
  vite: {
    // Tailwind 4 is wired through the Vite plugin (not @astrojs/tailwind).
    plugins: [tailwindcss()],
  },
});
