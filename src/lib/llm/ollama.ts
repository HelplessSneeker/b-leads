import OpenAI from 'openai';
import { z } from 'zod';
import type { Classification, LLMProvider, Mail } from './provider';

/**
 * Local Ollama provider (Phase 3) — Qwen2.5 7B via the OpenAI-compatible API.
 * Runs against a local `ollama serve`; the apiKey is a non-empty dummy since
 * Ollama ignores it. Prompts below are tuned against the real model (Schritt S2).
 */

const CLASSIFY_SYSTEM_PROMPT = `Du bist ein Assistent, der eingehende Vertriebs-/Lead-E-Mails klassifiziert.
Antworte AUSSCHLIESSLICH mit einem JSON-Objekt, ohne Markdown, ohne Erklärung.

Schema (alle Felder Pflicht):
{
  "sentiment": "positive" | "neutral" | "negative",
  "intent": "interested" | "pricing" | "not-now" | "no" | "question" | "other",
  "confidence": Zahl zwischen 0 und 1
}

Bedeutung von intent:
- "interested": zeigt klares Kaufinteresse / will weitermachen
- "pricing": fragt konkret nach Preis / Angebot / Kosten
- "not-now": grundsätzlich interessiert, aber zeitlich später
- "no": Absage / kein Interesse
- "question": inhaltliche Rückfrage ohne klares Kauf-/Absagesignal
- "other": passt in keine der obigen Kategorien

confidence ist deine Sicherheit bei der Einordnung (0 = unsicher, 1 = sehr sicher).
Gib nur Werte aus den erlaubten Enums zurück.`;

const DRAFT_SYSTEM_PROMPT = `Du bist ein deutschsprachiger Vertriebsmitarbeiter und schreibst einen
professionellen, freundlichen Antwort-Entwurf auf eine eingehende E-Mail.

Regeln:
- Antworte auf Deutsch, in der Sie-Form, sachlich und höflich.
- Erfinde KEINE Fakten, Preise, Termine, Rabatte oder Zusagen. Wenn dir
  Informationen fehlen, formuliere offen (z.B. Rückfrage oder Verweis auf ein
  folgendes Angebot), statt etwas zu erfinden.
- Gib NUR den Text des Antwort-Entwurfs zurück (Anrede bis Grußformel), ohne
  Betreffzeile, ohne Markdown, ohne zusätzliche Erläuterungen.`;

/** Zod-Schema, exakt synchron mit den Typen in ./provider.ts. */
const ClassificationSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  intent: z.enum(['interested', 'pricing', 'not-now', 'no', 'question', 'other']),
  confidence: z.number(),
});

/** Entfernt umschließende ```json … ``` / ``` … ```-Codefences, falls vorhanden. */
function stripCodeFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

export class OllamaProvider implements LLMProvider {
  private readonly client = new OpenAI({
    baseURL: process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
  });
  private readonly model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';

  async classify(mail: Mail): Promise<Classification> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CLASSIFY_SYSTEM_PROMPT },
        { role: 'user', content: `Betreff: ${mail.subject}\n\n${mail.body}` },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OllamaProvider.classify: leere Antwort vom Modell');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripCodeFences(content));
    } catch {
      throw new Error(`OllamaProvider.classify: Antwort ist kein gültiges JSON: ${content}`);
    }

    const result = ClassificationSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`OllamaProvider.classify: Antwort entspricht nicht dem Schema: ${content}`);
    }

    return {
      sentiment: result.data.sentiment,
      intent: result.data.intent,
      confidence: Math.max(0, Math.min(1, result.data.confidence)),
    };
  }

  async draftReply(mail: Mail, leadContext: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.5,
      messages: [
        { role: 'system', content: DRAFT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Kontext zum Lead:\n${leadContext}\n\nEingehende E-Mail:\nBetreff: ${mail.subject}\n\n${mail.body}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content?.trim()) {
      throw new Error('OllamaProvider.draftReply: leere Antwort vom Modell');
    }

    return content.trim();
  }
}
