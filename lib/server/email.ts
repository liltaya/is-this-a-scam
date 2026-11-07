import 'server-only';
import type { Check, Pair } from '@/lib/contracts';
import { piezas, records } from './piezas';
import { RISK_LABEL } from './email-template';

export function appUrl(request: Request): string {
  return (process.env.PIEZAS_APP_URL || new URL(request.url).origin).replace(/\/$/, '');
}

/** Emails the helper about a new check. Only names, the risk label and a sign-in link: never the message. */
export async function sendCheckAlert(request: Request, pair: Pair, check: Check): Promise<void> {
  await records(); // makes sure the check_alert template is defined
  const p = piezas();
  const { user: helper } = await p.users.getUser(pair.helperUserId);
  await p.notify('check_alert', {
    to: helper.email,
    mergeData: {
      parentName: pair.parentName,
      helperName: pair.helperName,
      riskLabel: RISK_LABEL[check.risk],
      reviewLink: `${appUrl(request)}/helper/checks/${encodeURIComponent(check.id)}`,
    },
  });
}
