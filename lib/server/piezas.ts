import 'server-only';
import { Piezas } from '@piezas/sdk';
import type { EntityClient } from '@piezas/sdk';
import { CHECK_ALERT_TEMPLATE } from './email-template';

// One Piezas client per server process. PIEZAS_API_KEY stays on the server.
let client: Piezas | undefined;
export function piezas(): Piezas {
  if (!client) {
    const apiKey = process.env.PIEZAS_API_KEY;
    if (!apiKey) throw new Error('PIEZAS_API_KEY is not set');
    client = new Piezas({ apiKey });
  }
  return client;
}

type Records = { pair: EntityClient; check: EntityClient };
let ready: Promise<Records> | undefined;

// The scenario test server sets PIEZAS_RECORD_PREFIX=test_ so its entity types
// stay separate from the live app's pair and check types.
const PREFIX = /^[a-z_]{0,12}$/.test(process.env.PIEZAS_RECORD_PREFIX ?? '')
  ? process.env.PIEZAS_RECORD_PREFIX ?? ''
  : '';

// Defines the record types and the email template once per process.
export function records(): Promise<Records> {
  if (!ready) {
    ready = (async () => {
      const p = piezas();
      const defined = await p.defineEntities({
        [`${PREFIX}pair`]: {
          fields: {
            parentUserId: { type: 'text', required: true },
            helperUserId: { type: 'text', required: true },
            parentName: { type: 'text', required: true },
            helperName: { type: 'text', required: true },
            helperPhone: { type: 'phone' },
          },
        },
        [`${PREFIX}check`]: {
          fields: {
            pairId: { type: 'text', required: true },
            parentUserId: { type: 'text', required: true },
            maskedText: { type: 'longtext' },
            screenshotFileId: { type: 'text' },
            risk: { type: 'select', options: ['red', 'yellow', 'green'], required: true },
            // Flag[] as JSON: Piezas records have no list-of-objects field type.
            flagsJson: { type: 'longtext' },
            summary: { type: 'text' },
            engine: { type: 'select', options: ['rules+ai', 'rules-only'] },
            helperAnswer: { type: 'select', options: ['pending', 'scam', 'safe'], required: true },
            helperNote: { type: 'text' },
            answeredAt: { type: 'datetime' },
            textClearedAt: { type: 'datetime' },
          },
        },
      });
      await p.defineTemplates({ check_alert: CHECK_ALERT_TEMPLATE });
      const byName = defined as Record<string, EntityClient>;
      return { pair: byName[`${PREFIX}pair`], check: byName[`${PREFIX}check`] };
    })().catch((err) => {
      ready = undefined; // let the next request try again
      throw err;
    });
  }
  return ready;
}
