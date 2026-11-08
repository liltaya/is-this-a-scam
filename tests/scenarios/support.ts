import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';
import { Piezas } from '@piezas/sdk';
import type { Check, Flag, Pair, Risk } from '../../lib/contracts';
import type { NotificationMessage } from '@piezas/sdk';

const key = process.env.PIEZAS_TEST_API_KEY;
if (!key) throw new Error('The separate Piezas test copy is not configured.');

const piezas = new Piezas({ apiKey: key, apiBaseUrl: process.env.PIEZAS_API_URL });
// Must match PIEZAS_RECORD_PREFIX in playwright.config.ts (the test server's record names).
const PREFIX = 'test_';
const defined = piezas.defineEntities({
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
const entities = defined.then((d) => {
  const byName = d as Record<string, Awaited<typeof defined>[keyof Awaited<typeof defined>]>;
  return { pair: byName[`${PREFIX}pair`], check: byName[`${PREFIX}check`] };
});

export type ScenarioFixture = {
  pair: Pair;
  check: Check | null;
  helperEmail: string;
  helperPassword: string;
  parentEmail: string;
  parentPassword: string;
};

export async function createScenarioFixture(options: {
  text?: string;
  risk?: Risk;
  flags?: Flag[];
  helperAnswer?: 'pending' | 'scam' | 'safe';
  helperNote?: string;
  helperPhone?: string | null;
  withCheck?: boolean;
} = {}): Promise<ScenarioFixture> {
  const { pair, check } = await entities;
  const tag = randomUUID();
  const inbox = process.env.PIEZAS_TEST_USER_EMAIL;
  const [inboxName, inboxDomain] = inbox?.split('@') ?? [];
  const helperEmail = inboxName && inboxDomain
    ? `${inboxName}+family-${tag.slice(0, 10)}@${inboxDomain}`
    : `alex-${tag}@example.test`;
  const parentEmail = `galina-${tag}@example.test`;
  const helperPassword = `Helper-${tag}-pass!`;
  const parentPassword = `Parent-${tag}-pass!`;
  const imported = await piezas.users.importUsers([
    { email: helperEmail, password: helperPassword, emailVerified: true, profile: { role: 'helper', name: 'Alex' } },
    { email: parentEmail, password: parentPassword, emailVerified: true, profile: { role: 'parent', name: 'Galina' } },
  ]);
  const failures = imported.results.filter((result) => result.error);
  if (failures.length) throw new Error(`Could not prepare scenario accounts: ${failures.map((failure) => failure.error).join(', ')}`);

  const [helperUser, parentUser] = await Promise.all([
    piezas.users.listUsers({ email: helperEmail, limit: 1 }),
    piezas.users.listUsers({ email: parentEmail, limit: 1 }),
  ]);
  const helper = helperUser.users[0];
  const parent = parentUser.users[0];
  if (!helper?.id || !parent?.id) throw new Error('Scenario accounts were not created in the test copy.');
  if (helper.status !== 'active') await piezas.users.updateUser(helper.id, { status: 'active' });
  if (parent.status !== 'active') await piezas.users.updateUser(parent.id, { status: 'active' });

  const pairRecord = await pair.create({
    title: 'Galina and Alex',
    data: {
      parentUserId: parent.id,
      helperUserId: helper.id,
      parentName: 'Galina',
      helperName: 'Alex',
      helperPhone: options.helperPhone ?? '+1 604 555 0147',
    },
  });
  if (options.withCheck === false) {
    return {
      pair: {
        id: pairRecord.id,
        parentUserId: parent.id,
        helperUserId: helper.id,
        parentName: 'Galina',
        helperName: 'Alex',
        helperPhone: options.helperPhone ?? '+1 604 555 0147',
        createdAt: pairRecord.createdAt,
      },
      check: null,
      helperEmail,
      helperPassword,
      parentEmail,
      parentPassword,
    };
  }

  const text = options.text ?? 'Grandma, I need gift cards today. Please do not tell anyone.';
  const flags = options.flags ?? [{
    type: 'gift_cards', quote: 'gift cards', explain: 'Real family members do not ask for gift cards.', source: 'rules',
  }];
  const helperAnswer = options.helperAnswer ?? 'pending';
  const createdAt = new Date().toISOString();
  const checkRecord = await check.create({
    title: `Scenario check ${tag}`,
    tags: ['text-kept'],
    data: {
      pairId: pairRecord.id,
      parentUserId: parent.id,
      maskedText: text,
      screenshotFileId: '',
      risk: options.risk ?? 'red',
      flagsJson: JSON.stringify(flags),
      summary: 'This message has warning signs. Wait for Alex before you act.',
      engine: 'rules-only',
      helperAnswer,
      helperNote: options.helperNote ?? '',
      answeredAt: helperAnswer === 'pending' ? '' : createdAt,
      textClearedAt: '',
    },
  });

  return {
    pair: {
      id: pairRecord.id,
      parentUserId: parent.id,
      helperUserId: helper.id,
      parentName: 'Galina',
      helperName: 'Alex',
      helperPhone: options.helperPhone ?? '+1 604 555 0147',
      createdAt: pairRecord.createdAt,
    },
    check: {
      id: checkRecord.id,
      pairId: pairRecord.id,
      parentUserId: parent.id,
      maskedText: text,
      screenshotFileId: null,
      risk: options.risk ?? 'red',
      flags,
      summary: 'This message has warning signs. Wait for Alex before you act.',
      engine: 'rules-only',
      helperAnswer,
      helperNote: null,
      createdAt: checkRecord.createdAt,
      answeredAt: helperAnswer === 'pending' ? null : createdAt,
      textClearedAt: null,
    },
    helperEmail,
    helperPassword,
    parentEmail,
    parentPassword,
  };
}

export async function createCheckForFixture(fixture: ScenarioFixture, options: {
  text: string;
  risk: Risk;
  flags: Flag[];
  engine?: 'rules+ai' | 'rules-only';
  helperAnswer?: 'pending' | 'scam' | 'safe';
}): Promise<Check> {
  if (!fixture.pair) throw new Error('The scenario pair is missing.');
  const { check } = await entities;
  const helperAnswer = options.helperAnswer ?? 'pending';
  const answeredAt = helperAnswer === 'pending' ? '' : new Date().toISOString();
  const record = await check.create({
    title: `Scenario check ${randomUUID()}`,
    tags: ['text-kept'],
    data: {
      pairId: fixture.pair.id,
      parentUserId: fixture.pair.parentUserId,
      maskedText: options.text,
      screenshotFileId: '',
      risk: options.risk,
      flagsJson: JSON.stringify(options.flags),
      summary: options.flags.length ? 'This message has warning signs. Wait for Alex before you act.' : 'No warning signs were found, but wait for Alex before you act.',
      engine: options.engine ?? 'rules-only',
      helperAnswer,
      helperNote: '',
      answeredAt,
      textClearedAt: '',
    },
  });
  return {
    id: record.id,
    pairId: fixture.pair.id,
    parentUserId: fixture.pair.parentUserId,
    maskedText: options.text,
    screenshotFileId: null,
    risk: options.risk,
    flags: options.flags,
    summary: options.flags.length ? 'This message has warning signs. Wait for Alex before you act.' : 'No warning signs were found, but wait for Alex before you act.',
    engine: options.engine ?? 'rules-only',
    helperAnswer,
    helperNote: null, // this helper always saves an empty note
    createdAt: record.createdAt,
    answeredAt: answeredAt || null,
    textClearedAt: null,
  };
}

export async function alertMessagesForCheck(fixture: ScenarioFixture, checkId: string): Promise<NotificationMessage[]> {
  const reviewPath = `/helper/checks/${encodeURIComponent(checkId)}`;
  const messages = await piezas.messages.list({ limit: 100 });
  return messages.filter((message) =>
    message.recipient.toLowerCase() === fixture.helperEmail.toLowerCase()
    && message.bodyRendered.includes(reviewPath),
  );
}

export function uniqueTestEmail(label: string): string {
  const inbox = process.env.PIEZAS_TEST_USER_EMAIL;
  const [name, domain] = inbox?.split('@') ?? [];
  if (!name || !domain) throw new Error('The separate test inbox is not configured.');
  return `${name}+${label}-${randomUUID().slice(0, 12)}@${domain}`;
}

export async function waitForEmail(
  recipient: string,
  match: (message: NotificationMessage) => boolean,
  timeoutMs = 30_000,
): Promise<NotificationMessage> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const messages = await piezas.messages.list({ limit: 100 });
    const found = messages.find((message) => message.recipient.toLowerCase() === recipient.toLowerCase() && match(message));
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('The expected email did not arrive in the test inbox.');
}

export async function signInParent(page: Page, fixture: ScenarioFixture) {
  await page.goto('/setup?name=Galina');
  await page.getByTestId('setup-email').fill(fixture.parentEmail);
  await page.getByTestId('setup-password').fill(fixture.parentPassword);
  await page.getByTestId('setup-signin').click();
  await expect(page.getByTestId('setup-go-home')).toBeVisible();
}

export async function signInHelper(page: Page, fixture: ScenarioFixture) {
  await page.goto('/helper/signin');
  await page.getByTestId('signin-email').fill(fixture.helperEmail);
  await page.getByTestId('signin-password').fill(fixture.helperPassword);
  await page.getByTestId('signin-submit').click();
  await expect(page).toHaveURL(/\/helper\/mfa\/setup/);
}

export async function hasHelperViewAudit(fixture: ScenarioFixture): Promise<boolean> {
  const result = await piezas.users.signIn({ email: fixture.helperEmail, password: fixture.helperPassword });
  if (!result.session) throw new Error('The test caregiver could not sign in to check the audit trail.');
  const verified = await piezas.users.getSession(result.session.token);
  if (!verified.valid || !verified.claims) throw new Error('The test caregiver session could not be verified.');
  const events = await piezas.admin.listAuditEvents(verified.claims.tenantId, {
    resourceType: 'check',
    resourceId: fixture.check?.id,
    limit: 100,
  });
  return events.some((event) => event.action === 'check.viewed' && event.actorId === fixture.pair.helperUserId);
}
