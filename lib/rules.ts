import type { Flag, FlagType, Risk } from './sample-data';

const RULES: { type: FlagType; pattern: RegExp; explain: string }[] = [
  { type: 'gift_cards', pattern: /gift ?cards?/i, explain: 'Real family and real companies never ask to be paid in gift cards.' },
  { type: 'urgency', pattern: /\b(today|right now|immediately|urgent|within \d+ hours?)\b/i, explain: 'Scammers push you to act fast so you have no time to check.' },
  { type: 'secrecy', pattern: /don'?t tell/i, explain: 'Asking you to keep it secret stops you from checking with family.' },
  { type: 'impersonation', pattern: /\b(CRA|IRS|Service Canada|RCMP)\b/, explain: 'Government offices do not send money or demands by text with a link.' },
  { type: 'codes', pattern: /confirm your (details|account|identity)/i, explain: 'Real companies do not ask you to confirm details through a link.' },
  { type: 'link', pattern: /\b[\w-]+\.(info|xyz|top|click|link)\b/i, explain: 'This link does not look like a real company or government website.' },
  { type: 'money', pattern: /\b(wire|bitcoin|crypto|e-?transfer)\b/i, explain: 'Being asked to send money this way is a common scam sign.' },
];

export function runRules(maskedText: string): { risk: Risk; flags: Flag[] } {
  const flags: Flag[] = [];
  for (const r of RULES) {
    const m = maskedText.match(r.pattern);
    if (m) flags.push({ type: r.type, quote: m[0], explain: r.explain, source: 'rules' });
  }
  const risk: Risk = flags.length >= 2 ? 'red' : flags.length === 1 ? 'yellow' : 'green';
  return { risk, flags };
}
