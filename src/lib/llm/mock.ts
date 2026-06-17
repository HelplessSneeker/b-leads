import type { Classification, LLMProvider, Mail } from './provider';

/**
 * Deterministic mock provider — default in dev (LLM_PROVIDER=mock).
 * Returns fixed values so the rest of the app can be built/tested without a
 * real LLM. Replaced by ollama/mistral in Phase 3.
 */
export class MockProvider implements LLMProvider {
  async classify(_mail: Mail): Promise<Classification> {
    return { sentiment: 'neutral', intent: 'other', confidence: 0.5 };
  }

  async draftReply(mail: Mail, _leadContext: string): Promise<string> {
    return `Hallo,\n\nvielen Dank für Ihre Nachricht zu "${mail.subject}". [MOCK DRAFT — Phase 3 generiert hier eine echte Antwort.]\n\nBeste Grüße`;
  }
}
