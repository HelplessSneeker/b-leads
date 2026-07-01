/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DB_PATH?: string;
  readonly LLM_PROVIDER?: 'mock' | 'ollama' | 'mistral';
  readonly OLLAMA_BASE_URL?: string;
  readonly OLLAMA_MODEL?: string;
  readonly MISTRAL_API_KEY?: string;
  readonly MISTRAL_BASE_URL?: string;
  readonly MISTRAL_MODEL?: string;
  readonly IMAP_HOST?: string;
  readonly IMAP_PORT?: string;
  readonly IMAP_USER?: string;
  readonly IMAP_PASSWORD?: string;
  readonly IMAP_TLS?: string;
  readonly AUTH_ALLOWLIST?: string;
  readonly AUTH_TOKEN_SECRET?: string;
  readonly AUTH_TOKEN_TTL_MINUTES?: string;
  readonly APP_BASE_URL?: string;
  readonly MAIL_PROVIDER?: 'mock' | 'brevo';
  readonly BREVO_API_KEY?: string;
  readonly AUTH_FROM_EMAIL?: string;
  readonly AUTH_FROM_NAME?: string;
}

// Astro reads these via ambient declaration merging (Astro.session.get/set,
// Astro.locals). Biome cannot see the usage and flags them as unused.
namespace App {
  // biome-ignore lint/correctness/noUnusedVariables: ambient Astro augmentation
  interface SessionData {
    userId: string;
    email: string;
  }
  // biome-ignore lint/correctness/noUnusedVariables: ambient Astro augmentation
  interface Locals {
    userId?: string;
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
