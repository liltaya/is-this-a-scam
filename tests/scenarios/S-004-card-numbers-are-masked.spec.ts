// piezas-scenario: S-004 v=052e085f184d
// S-004: Card numbers are masked
//   Given Galina on the paste screen
//   When she submits a message containing 4111 1111 1111 1111
//   Then the saved check and every screen show  1111, and the full number appears nowhere, including what is sent to the Claude API
//
import { expect, test } from '@playwright/test';
import { analyzeText } from '../../lib/analyze-core';
import { createScenarioFixture, signInHelper, signInParent } from './support';

test("S-004: Card numbers are masked", async ({ page }) => {
  const fixture = await createScenarioFixture({ withCheck: false });
  const fullNumber = '4111 1111 1111 1111';
  let modelRequest = '';
  const modelResponse = Response.json({
    content: [{ type: 'text', text: JSON.stringify({ risk: 'red', flags: [], summary: 'Wait for your helper.' }) }],
    stop_reason: 'end_turn',
  });
  await analyzeText({ text: `I need gift cards today. The account is ${fullNumber}.` }, {
    apiKey: 'test-only-key',
    fetcher: async (_input, init) => {
      modelRequest = String(init?.body ?? '');
      return modelResponse;
    },
  });
  expect(modelRequest).toContain('**** 1111');
  expect(modelRequest).not.toContain(fullNumber);
  await signInParent(page, fixture);
  await page.goto('/');
  await page.getByTestId('start-check').click();
  await page.getByTestId('message-input').fill(`I need gift cards today. The account is ${fullNumber}.`);
  const createdResponse = page.waitForResponse((response) => response.url().endsWith('/api/checks') && response.request().method() === 'POST');
  await page.getByTestId('submit-check').click();
  const created = await createdResponse;
  expect(created.ok()).toBeTruthy();
  const createdResult = await created.json() as { check: { id: string } };
  const id = createdResult.check.id;

  await expect(page.getByTestId('checked-message')).toContainText('**** 1111');
  await expect(page.getByText(fullNumber, { exact: false })).toHaveCount(0);
  const stored = await page.evaluate(async (checkId) => {
    const response = await fetch(`/api/checks/${encodeURIComponent(checkId)}`, { cache: 'no-store' });
    return await response.json() as { check: { maskedText: string | null } };
  }, id);
  expect(stored.check.maskedText).toContain('**** 1111');
  expect(JSON.stringify(stored)).not.toContain(fullNumber);

  await signInHelper(page, fixture);
  await page.goto(`/helper/checks/${encodeURIComponent(id)}`);
  await expect(page.getByTestId('masked-text')).toContainText('**** 1111');
  await expect(page.getByText(fullNumber, { exact: false })).toHaveCount(0);
});
