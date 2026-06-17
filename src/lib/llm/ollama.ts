import type { Classification, LLMProvider, Mail } from './provider';

/**
 * Local Ollama provider (Phase 3) — Qwen2.5 7B via the OpenAI-compatible API.
 * Skeleton only: wire up the `openai` SDK with baseURL=OLLAMA_BASE_URL and a
 * dummy apiKey, then implement classify/draftReply with structured prompts.
 */
export class OllamaProvider implements LLMProvider {
  // private readonly client = new OpenAI({
  //   baseURL: process.env.OLLAMA_BASE_URL,
  //   apiKey: 'ollama',
  // });
  // private readonly model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';

  async classify(_mail: Mail): Promise<Classification> {
    throw new Error('OllamaProvider.classify not implemented (Phase 3)');
  }

  async draftReply(_mail: Mail, _leadContext: string): Promise<string> {
    throw new Error('OllamaProvider.draftReply not implemented (Phase 3)');
  }
}
