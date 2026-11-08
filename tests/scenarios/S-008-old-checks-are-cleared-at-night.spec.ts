// piezas-scenario: S-008 v=d2199d5e8c94
// S-008: Old checks are cleared at night
//   Given a check older than 30 days with risk red, a flag of type gift cards, helper answer scam and a helper note
//   When the nightly 3:00 a.m. Vancouver clean-up runs
//   Then its masked text, flag quotes and explanations, summary and helper note are blank, "text cleared at" is set, and its risk, flag types, helper answer and timestamps are unchanged
//
import { expect, test } from '@playwright/test';
import { createScenarioFixture, signInParent } from './support';

test("S-008: Old checks are cleared at night", async ({ page }) => {
  const fixture = await createScenarioFixture({
    helperAnswer: 'scam',
    helperNote: 'Please call me before responding.',
    flags: [{ type: 'gift_cards', quote: 'gift cards', explain: 'Scammers ask for gift cards.', source: 'rules' }],
  });
  await signInParent(page, fixture);
  const before = await page.evaluate(async (checkId) => {
    const response = await fetch(`/api/checks/${encodeURIComponent(checkId)}`, { cache: 'no-store' });
    return await response.json() as { check: { createdAt: string; answeredAt: string | null } };
  }, fixture.check!.id);

  const futureDate = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
  const cleanup = await page.request.post(
    `/api/jobs/retention?asOf=${encodeURIComponent(futureDate)}&checkId=${encodeURIComponent(fixture.check!.id)}`,
    { headers: { Authorization: `Bearer ${process.env.PIEZAS_TEST_API_KEY}` } },
  );
  expect(cleanup.ok()).toBeTruthy();
  expect((await cleanup.json() as { cleared: number }).cleared).toBe(1);

  await page.goto(`/check/${encodeURIComponent(fixture.check!.id)}`);
  await expect(page.getByTestId('text-cleared')).toContainText('cleared after 30 days');
  await expect(page.getByTestId('helper-answer')).toContainText('Scam');
  const after = await page.evaluate(async (checkId) => {
    const response = await fetch(`/api/checks/${encodeURIComponent(checkId)}`, { cache: 'no-store' });
    return await response.json() as { check: {
      maskedText: string | null;
      flags: Array<{ type: string; quote: string; explain: string }>;
      summary: string;
      helperNote: string | null;
      risk: string;
      helperAnswer: string;
      createdAt: string;
      answeredAt: string | null;
      textClearedAt: string | null;
    } };
  }, fixture.check!.id);
  expect(after.check.maskedText).toBeNull();
  expect(after.check.flags[0]).toMatchObject({ type: 'gift_cards', quote: '', explain: '' });
  expect(after.check.summary).toBe('');
  expect(after.check.helperNote).toBeNull();
  expect(after.check.textClearedAt).toBeTruthy();
  expect(after.check.risk).toBe('red');
  expect(after.check.helperAnswer).toBe('scam');
  expect(after.check.createdAt).toBe(before.check.createdAt);
  expect(after.check.answeredAt).toBe(before.check.answeredAt);
});
