import { MistralProvider } from './mistral';
import { MockProvider } from './mock';
import { OllamaProvider } from './ollama';
import type { LLMProvider } from './provider';

export type { Classification, LLMProvider, Mail } from './provider';

/**
 * Returns the LLM provider selected via the LLM_PROVIDER env var.
 * Defaults to the mock provider (dev). Real providers are implemented in Phase 3.
 */
export function getProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? 'mock';
  switch (provider) {
    case 'ollama':
      return new OllamaProvider();
    case 'mistral':
      return new MistralProvider();
    default:
      return new MockProvider();
  }
}
