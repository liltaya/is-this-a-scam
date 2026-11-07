// Made-up records for the design preview only. Real records will live in Piezas.
export type Risk = 'red' | 'yellow' | 'green';
export type HelperAnswer = 'pending' | 'scam' | 'safe';
export type Flag = { type: string; quote: string; explanation: string; source: 'rules' | 'ai' };
export type Check = {
  id: string;
  maskedText: string;
  risk: Risk;
  flags: Flag[];
  summary: string;
  engine: 'rules+ai' | 'rules-only';
  helperAnswer: HelperAnswer;
  helperNote?: string;
  createdAt: string;
  answeredAt?: string;
};

export const pair = {
  parentName: 'Galina',
  helperName: 'Alex',
  helperPhone: '+1 604 555 0142',
};

export const checks: Check[] = [
  {
    id: 'c1',
    maskedText:
      "Grandma it's me. I'm in trouble and need $900 in gift cards today. Please don't tell Mom.",
    risk: 'red',
    flags: [
      { type: 'Gift cards', quote: '$900 in gift cards', explanation: 'Real family and real companies never ask to be paid in gift cards.', source: 'rules' },
      { type: 'Rush', quote: 'today', explanation: 'Scammers push you to act fast so you have no time to check.', source: 'rules' },
      { type: 'Secrecy', quote: "Please don't tell Mom", explanation: 'Asking you to keep it secret stops you from checking with family.', source: 'ai' },
      { type: 'Family emergency', quote: "Grandma it's me. I'm in trouble", explanation: 'A common trick: pretending to be a grandchild in trouble.', source: 'ai' },
    ],
    summary: 'This looks like the "grandchild in trouble" scam asking for gift cards.',
    engine: 'rules+ai',
    helperAnswer: 'pending',
    createdAt: '2026-11-06T17:42:00-08:00',
  },
  {
    id: 'c2',
    maskedText:
      'CRA: You have an unclaimed tax refund of $1,280. Confirm your details within 24 hours at cra-refund-secure.info',
    risk: 'red',
    flags: [
      { type: 'Pretends to be government', quote: 'CRA', explanation: 'The CRA does not send refunds by text with a link.', source: 'rules' },
      { type: 'Strange link', quote: 'cra-refund-secure.info', explanation: 'This is not a government website. Real CRA sites end in canada.ca.', source: 'ai' },
      { type: 'Rush', quote: 'within 24 hours', explanation: 'A deadline is meant to scare you into acting quickly.', source: 'rules' },
    ],
    summary: 'A fake tax refund text that wants your personal details.',
    engine: 'rules+ai',
    helperAnswer: 'scam',
    helperNote: "Mom, this is fake. Delete it. I'll call you tonight.",
    createdAt: '2026-11-04T10:15:00-08:00',
    answeredAt: '2026-11-04T10:18:00-08:00',
  },
  {
    id: 'c3',
    maskedText:
      'Kingsway Pharmacy: your prescription is ready for pickup. Questions? Call us at the store.',
    risk: 'green',
    flags: [],
    summary: 'No warning signs found, but wait for Alex before acting.',
    engine: 'rules+ai',
    helperAnswer: 'safe',
    createdAt: '2026-11-02T09:05:00-08:00',
    answeredAt: '2026-11-02T09:07:00-08:00',
  },
  {
    // The original message had the full card number; only the masked text is ever stored.
    id: 'c4',
    maskedText:
      'Amazon Security: A $649.99 purchase was charged to your card **** 1111. If this was not you, cancel immediately at amzn-refund-help.info',
    risk: 'red',
    flags: [
      { type: 'Rush', quote: 'immediately', explanation: 'Scammers push you to act fast so you have no time to check.', source: 'rules' },
      { type: 'Fake company alert', quote: 'Amazon Security', explanation: 'Amazon does not text you a link to cancel a purchase. Check your orders in the Amazon app instead.', source: 'ai' },
      { type: 'Strange link', quote: 'amzn-refund-help.info', explanation: 'This is not an Amazon website. The link goes to the scammer.', source: 'rules' },
    ],
    summary: 'A fake purchase alert that wants you to open a scam link.',
    engine: 'rules+ai',
    helperAnswer: 'pending',
    createdAt: '2026-11-06T12:20:00-08:00',
  },
];

export function findCheck(id: string): Check | undefined {
  return checks.find((c) => c.id === id);
}

export const riskLabel: Record<Risk, string> = {
  red: 'Looks like a scam',
  yellow: 'Be careful',
  green: 'No warning signs found',
};
