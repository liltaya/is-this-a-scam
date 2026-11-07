import type { Flag, Risk } from './sample-data';

const RULES: { type: string; pattern: RegExp; explanation: string }[] = [
  { type: 'Gift cards', pattern: /gift ?cards?/i, explanation: 'Real family and real companies never ask to be paid in gift cards.' },
  { type: 'Rush', pattern: /\b(today|right now|immediately|urgent|within \d+ hours?)\b/i, explanation: 'Scammers push you to act fast so you have no time to check.' },
  { type: 'Secrecy', pattern: /don'?t tell/i, explanation: 'Asking you to keep it secret stops you from checking with family.' },
  { type: 'Pretends to be government', pattern: /\b(CRA|IRS|Service Canada|RCMP)\b/, explanation: 'Government offices do not send money or demands by text with a link.' },
  { type: 'Asks for details', pattern: /confirm your (details|account|identity)/i, explanation: 'Real companies do not ask you to confirm details through a link.' },
  { type: 'Strange link', pattern: /\b[\w-]+\.(info|xyz|top|click|link)\b/i, explanation: 'This link does not look like a real company or government website.' },
  { type: 'Money transfer', pattern: /\b(wire|bitcoin|crypto|e-?transfer)\b/i, explanation: 'Being asked to send money this way is a common scam sign.' },
];

export function runRules(maskedText: string): { risk: Risk; flags: Flag[] } {
  const flags: Flag[] = [];
  for (const r of RULES) {
    const m = maskedText.match(r.pattern);
    if (m) flags.push({ type: r.type, quote: m[0], explanation: r.explanation, source: 'rules' });
  }
  const risk: Risk = flags.length >= 2 ? 'red' : flags.length === 1 ? 'yellow' : 'green';
  return { risk, flags };
}
