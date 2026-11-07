import 'server-only';
import type { AnalyzeResult, Flag, FlagType } from '@/lib/contracts';
import { maskNumbers } from '@/lib/mask';

// STAND-IN for lib/ai/analyze.ts (owned by D). Same signature and shape as the
// contract. When D's engine lands, replace this whole file with:
//   export { analyze } from '@/lib/ai/analyze';

const RULES: { type: FlagType; pattern: RegExp; explain: string }[] = [
  { type: 'gift_cards', pattern: /gift ?cards?/i, explain: 'Real family and real companies never ask to be paid in gift cards.' },
  { type: 'urgency', pattern: /\b(today|right now|immediately|urgent|within \d+ hours?)\b/i, explain: 'Scammers push you to act fast so you have no time to check.' },
  { type: 'secrecy', pattern: /don'?t tell/i, explain: 'Asking you to keep it secret stops you from checking with family.' },
  { type: 'impersonation', pattern: /\b(CRA|IRS|Service Canada|RCMP|Amazon Security)\b/i, explain: 'They pretend to be someone official so you trust them.' },
  { type: 'link', pattern: /\b[\w-]+\.(info|xyz|top|click|link)\b/i, explain: 'This link does not look like a real company or government website.' },
  { type: 'money', pattern: /\b(wire|bitcoin|crypto|e-?transfer)\b|\$\s?[\d,]+/i, explain: 'They are asking about money, a common scam sign.' },
  { type: 'codes', pattern: /\b(verification|security|one[- ]time) code\b/i, explain: 'Never share a code someone sends you.' },
];

export async function analyze(input: { text: string }): Promise<AnalyzeResult> {
  const maskedText = maskNumbers(input.text); // masks first; raw text goes nowhere else
  const flags: Flag[] = [];
  for (const r of RULES) {
    const m = maskedText.match(r.pattern);
    if (m && flags.length < 4) flags.push({ type: r.type, quote: m[0], explain: r.explain, source: 'rules' });
  }
  const risk = flags.length >= 2 ? 'red' : flags.length === 1 ? 'yellow' : 'green';
  const summary =
    risk === 'red' ? 'This message has several signs of a scam.'
    : risk === 'yellow' ? 'This message has one thing that scammers often use.'
    : 'We found no obvious warning signs, but wait for your helper before you act.';
  return { maskedText, risk, flags, summary, engine: 'rules-only' };
}
