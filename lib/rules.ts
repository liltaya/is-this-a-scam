import type { Flag, FlagType, Risk } from './sample-data';

// How a child or grandchild would address the reader.
const FAMILY = 'mom|mum|mommy|mummy|mama|mother|dad|daddy|papa|father|grandma|grandpa|granny|grandmother|grandfather|nana|nan|gran';

const RULES: { type: FlagType; pattern: RegExp; explain: string }[] = [
  { type: 'gift_cards', pattern: /gift ?cards?/i, explain: 'Real family and real companies never ask to be paid in gift cards.' },
  { type: 'urgency', pattern: /\b(today|tonight|right now|right away|immediately|urgent|within \d+ (hours?|days?))\b/i, explain: 'Scammers push you to act fast so you have no time to check.' },
  { type: 'secrecy', pattern: /don'?t (tell|call)|keep this (between us|secret)/i, explain: 'Asking you to keep it secret stops you from checking with family.' },
  { type: 'impersonation', pattern: /\b(CRA|IRS|Service Canada|RCMP|Immigration|warrant|arrest)\b/, explain: 'Government offices do not send money or demands by text with a link.' },
  { type: 'codes', pattern: /confirm your (details|account|identity)|\b(SIN|social insurance number|banking details|bank details|password)\b/i, explain: 'Real companies do not ask you to confirm details through a link or send your SIN by text.' },
  { type: 'link', pattern: /\b[\w-]+\.(info|xyz|top|click|link|online|site|shop)\b|\b(bit\.ly|tinyurl\.com|goo\.gl|ow\.ly|is\.gd)\//i, explain: 'This link does not look like a real company or government website.' },
  { type: 'money', pattern: /\b(wire|bitcoin|crypto|e-?transfer|western union|moneygram)\b|\b(processing|customs|redelivery|release) fee\b/i, explain: 'Being asked to send money this way, or to pay a fee first, is a common scam sign.' },
  { type: 'other', pattern: /\b(virus|malware|infected|hacked)\b/i, explain: 'Real companies do not warn you about viruses by text. Fake warnings are used to get you to call a scammer.' },
  // The "family member in trouble" scam, even without any of the words above (no gift cards, no "today").
  // "This is my new number" counts only when the message is written to a parent or grandparent:
  // a clinic, a pharmacy or a friend with a new phone number is ordinary news.
  {
    type: 'impersonation',
    pattern: new RegExp(
      [
        String.raw`\b(i'?m|i am) in (big |real |serious |a lot of )?trouble\b`,
        String.raw`\b(i'?m|i am) (in jail|in the hospital|in hospital|at the police station)\b`,
        String.raw`\b(i was|i'?ve been|i got) (arrested|in an? (car )?accident)\b`,
        String.raw`\bbail money\b`,
        String.raw`\b(lost|broke) my phone\b`,
        String.raw`\bmy new (phone )?number\b(?:(?<=\b(?:${FAMILY})\b[\s\S]*)|(?=[\s\S]*\b(?:${FAMILY})\b))`,
      ].join('|'),
      'i',
    ),
    explain:
      'Scammers often pretend to be a son, daughter or grandchild in trouble. Call them on the number you already have before you do anything.',
  },
  // A plain request for money. Amounts without a $ are hidden as **** by mask.ts, so **** counts too.
  {
    type: 'money',
    pattern: /\b(send|give|lend|transfer) (me|us) (some |the )?(money|cash|\$|\*{4}|\d)|\b(need|send) (some |the )?(money|cash)\b/i,
    explain: 'A message asking you to send money is the moment to stop and check, even when it seems to come from family.',
  },
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
