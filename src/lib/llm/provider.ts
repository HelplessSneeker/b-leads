/** A piece of mail to classify or draft a reply for. */
export interface Mail {
  subject: string;
  body: string;
}

export interface Classification {
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'interested' | 'pricing' | 'not-now' | 'no' | 'question' | 'other';
  confidence: number;
}

/**
 * Abstraction over an LLM backend. Implementations: mock (dev), ollama (local
 * Qwen2.5), mistral (production). All real backends use the OpenAI-compatible
 * SDK with a different baseURL + apiKey. See {@link ./index.ts} for selection.
 */
export interface LLMProvider {
  classify(mail: Mail): Promise<Classification>;
  draftReply(mail: Mail, leadContext: string): Promise<string>;
}
