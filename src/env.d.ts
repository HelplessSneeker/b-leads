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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
