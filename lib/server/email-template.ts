import type { Risk } from '@/lib/contracts';

// Wording from docs/contracts.md, "Helper alert email". No message text, ever.
export const CHECK_ALERT_TEMPLATE = {
  subject: '{{parentName}} would like your opinion on a message',
  body: `Hi {{helperName}},

{{parentName}} just received a message and wants to check it with you before doing anything.

Our first look: {{riskLabel}}

Open it here and answer in one tap:
{{reviewLink}}

Thank you for looking out for them.
Is This a Scam?`,
};

export const RISK_LABEL: Record<Risk, string> = {
  red: 'Several warning signs',
  yellow: 'A few warning signs',
  green: 'No obvious warning signs',
};
