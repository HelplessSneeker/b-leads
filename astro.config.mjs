// @ts-check
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// On-demand server rendering is required for Astro Actions + Sessions.
// Deployed on Coolify behind Tailscale (single-user, no auth in code).
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    // Tailwind 4 is wired through the Vite plugin (not @astrojs/tailwind).
    plugins: [tailwindcss()],
  },
});
