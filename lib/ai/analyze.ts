import { maskNumbers } from '../mask';
import { runRules } from '../rules';
import type { Flag, FlagType, Risk } from '../sample-data';

// Server only: reads ANTHROPIC_API_KEY, so never import this from a 'use client' file.
// Contract: docs/contracts.md, "Scam engine interface (D to C)".
export type AnalyzeResult = {
  maskedText: string;
  risk: Risk;
  flags: Flag[];
  summary: string;
  engine: 'rules+ai' | 'rules-only';
};

type AiCheck = { risk: Risk; summary: string; flags: Flag[] };

export const ANALYZE_MODEL = 'claude-haiku-5-5';
const TIMEOUT_MS = 8000;
const MAX_FLAGS = 4;
const FLAG_TYPES: FlagType[] = ['urgency', 'money', 'gift_cards', 'codes', 'secrecy', 'impersonation', 'link', 'other'];

const SYSTEM_PROMPT = `You check a suspicious message for an older adult. Card and account numbers in the message are already masked.
Reply with JSON only, no other text:
{"risk": "red" | "yellow" | "green", "summary": "...", "flags": [{"type": "...", "quote": "...", "explain": "..."}]}
- risk: red for a likely scam, yellow for some warning signs, green for none.
- type: one of ${FLAG_TYPES.join(', ')}.
- quote: copied exactly, word for word, from the message.
- explain: one short sentence in plain words.
- summary: one plain sentence an older adult understands. Never say the message is safe.
- At most ${MAX_FLAGS} flags.`;

// Checks a message. Masks first, so nothing unmasked leaves this function. Never throws.
// `useAi: false` skips Claude and returns the keyword-rules result (used by the S-010 test).
export async function analyze(input: { text: string }, options: { useAi?: boolean } = {}): Promise<AnalyzeResult> {
  return analyzeWithModel(input.text, ANALYZE_MODEL, options.useAi ?? true);
}

// analyze() with the model chosen by the caller. scripts/run-messages.ts uses it to compare models.
export async function analyzeWithModel(text: string, model: string, useAi = true): Promise<AnalyzeResult> {
  const maskedText = maskNumbers(text);
  const rules = runRules(maskedText);
  const rulesOnly = (): AnalyzeResult => ({
    maskedText,
    risk: rules.risk,
    flags: rules.flags.slice(0, MAX_FLAGS),
    summary: rulesSummary(rules.risk),
    engine: 'rules-only',
  });

  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key || !useAi) return rulesOnly();
    const ai = await withDeadline((signal) => askClaude(maskedText, model, key, signal), TIMEOUT_MS);
    if (!ai) return rulesOnly();

    const seen = new Set(rules.flags.map((f) => f.quote.toLowerCase()));
    const extra = ai.flags.filter((f) => !seen.has(f.quote.toLowerCase()));
    // Claude can raise the risk the rules found, never lower it. A message the rules flagged stays flagged.
    const risk = higherRisk(rules.risk, ai.risk);
    // The app never calls a message safe on its own, so a green summary must not say "safe".
    // Claude's summary only fits its own risk, so use the rules' summary when the risk was raised.
    const useAiSummary = risk === ai.risk && ai.summary !== '' && !(risk === 'green' && /\bsafe\b/i.test(ai.summary));
    return {
      maskedText,
      risk,
      flags: [...rules.flags, ...extra].slice(0, MAX_FLAGS),
      summary: useAiSummary ? ai.summary : rulesSummary(risk),
      engine: 'rules+ai',
    };
  } catch {
    return rulesOnly();
  }
}

const RISK_RANK: Record<Risk, number> = { green: 0, yellow: 1, red: 2 };

function higherRisk(a: Risk, b: Risk): Risk {
  return RISK_RANK[a] >= RISK_RANK[b] ? a : b;
}

function rulesSummary(risk: Risk): string {
  if (risk === 'red') return 'Several warning signs found. Do not reply or pay until you talk to someone you trust.';
  if (risk === 'yellow') return 'A few warning signs found. Wait for your helper before you reply or pay.';
  return 'No obvious warning signs found, but wait for your helper before you act.';
}

// Runs the call, but gives up after ms and aborts it. The timer keeps the process alive, so the wait always ends.
async function withDeadline<T>(run: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T | null> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, ms);
  });
  try {
    return await Promise.race([run(controller.signal), deadline]);
  } finally {
    clearTimeout(timer);
  }
}

async function askClaude(maskedText: string, model: string, key: string, signal: AbortSignal): Promise<AiCheck | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: maskedText }],
    }),
    signal,
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  const reply = body.content?.find((block) => block.type === 'text')?.text ?? '';
  return parseAiReply(reply, maskedText);
}

// Reads the model's JSON reply. Drops any flag whose quote is not in the masked text.
export function parseAiReply(reply: string, maskedText: string): AiCheck | null {
  const start = reply.indexOf('{');
  const end = reply.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  let data: unknown;
  try {
    data = JSON.parse(reply.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const { risk, summary, flags } = data as { risk?: unknown; summary?: unknown; flags?: unknown };
  if (risk !== 'red' && risk !== 'yellow' && risk !== 'green') return null;
  return {
    risk,
    summary: typeof summary === 'string' ? summary.trim().slice(0, 300) : '',
    flags: Array.isArray(flags) ? flags.flatMap((f) => toFlag(f, maskedText)).slice(0, MAX_FLAGS) : [],
  };
}

function toFlag(raw: unknown, maskedText: string): Flag[] {
  if (!raw || typeof raw !== 'object') return [];
  const { type, quote, explain } = raw as Record<string, unknown>;
  if (typeof quote !== 'string' || !quote || !maskedText.includes(quote)) return [];
  if (typeof explain !== 'string' || !explain.trim()) return [];
  const flagType = FLAG_TYPES.includes(type as FlagType) ? (type as FlagType) : 'other';
  return [{ type: flagType, quote, explain: explain.trim().slice(0, 200), source: 'ai' }];
}
