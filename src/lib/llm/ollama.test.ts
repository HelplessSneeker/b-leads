import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();

vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

// Import after the mock is registered so the provider picks up the mocked SDK.
import { OllamaProvider } from './ollama';

function mockReply(content: string) {
  createMock.mockResolvedValue({ choices: [{ message: { content } }] });
}

describe('OllamaProvider.classify', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it('maps valid model JSON to a Classification', async () => {
    mockReply(JSON.stringify({ sentiment: 'positive', intent: 'pricing', confidence: 0.82 }));

    const result = await new OllamaProvider().classify({
      subject: 'Angebot?',
      body: 'Was kostet das?',
    });

    expect(result).toEqual({ sentiment: 'positive', intent: 'pricing', confidence: 0.82 });
  });

  it('parses JSON wrapped in code fences', async () => {
    mockReply('```json\n{"sentiment":"neutral","intent":"question","confidence":0.4}\n```');

    const result = await new OllamaProvider().classify({
      subject: 'Frage',
      body: 'Wie funktioniert das?',
    });

    expect(result).toEqual({ sentiment: 'neutral', intent: 'question', confidence: 0.4 });
  });

  it('clamps confidence above 1 down to 1', async () => {
    mockReply(JSON.stringify({ sentiment: 'positive', intent: 'interested', confidence: 1.7 }));

    const result = await new OllamaProvider().classify({ subject: 'Hi', body: 'Klingt super!' });

    expect(result.confidence).toBe(1);
  });

  it('clamps negative confidence up to 0', async () => {
    mockReply(JSON.stringify({ sentiment: 'negative', intent: 'no', confidence: -0.3 }));

    const result = await new OllamaProvider().classify({
      subject: 'Nein',
      body: 'Kein Interesse.',
    });

    expect(result.confidence).toBe(0);
  });

  it('throws on an enum value outside the schema', async () => {
    mockReply(JSON.stringify({ sentiment: 'angry', intent: 'pricing', confidence: 0.5 }));

    await expect(new OllamaProvider().classify({ subject: 'x', body: 'y' })).rejects.toThrow();
  });

  it('throws on non-JSON output', async () => {
    mockReply('Ich denke, das ist positiv.');

    await expect(new OllamaProvider().classify({ subject: 'x', body: 'y' })).rejects.toThrow();
  });
});

describe('OllamaProvider.draftReply', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it('returns the message content as a string', async () => {
    mockReply('Hallo,\n\nvielen Dank für Ihre Nachricht.\n\nBeste Grüße');

    const draft = await new OllamaProvider().draftReply(
      { subject: 'Anfrage', body: 'Bitte um Infos.' },
      'Lead: Max Mustermann, Status: new',
    );

    expect(draft).toBe('Hallo,\n\nvielen Dank für Ihre Nachricht.\n\nBeste Grüße');
  });

  it('throws on empty content', async () => {
    mockReply('   ');

    await expect(
      new OllamaProvider().draftReply({ subject: 'x', body: 'y' }, 'ctx'),
    ).rejects.toThrow();
  });
});
