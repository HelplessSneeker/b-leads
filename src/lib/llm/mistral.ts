import type { Classification, LLMProvider, Mail } from './provider';

/**
 * Mistral provider (Phase 3, production) — via the OpenAI-compatible API.
 * Skeleton only: wire up the `openai` SDK with baseURL=MISTRAL_BASE_URL and
 * apiKey=MISTRAL_API_KEY, then implement classify/draftReply.
 */
export class MistralProvider implements LLMProvider {
  // private readonly client = new OpenAI({
  //   baseURL: process.env.MISTRAL_BASE_URL,
  //   apiKey: process.env.MISTRAL_API_KEY,
  // });
  // private readonly model = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';

  async classify(_mail: Mail): Promise<Classification> {
    throw new Error('MistralProvider.classify not implemented (Phase 3)');
  }

  async draftReply(_mail: Mail, _leadContext: string): Promise<string> {
    throw new Error('MistralProvider.draftReply not implemented (Phase 3)');
  }
}
