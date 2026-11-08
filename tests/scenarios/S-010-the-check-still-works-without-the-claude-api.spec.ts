// piezas-scenario: S-010 v=77e4bc4a1460
// S-010: The check still works without the Claude API
//   Given the Claude API cannot be reached
//   When Galina submits the gift card message
//   Then she still gets a red result from the keyword rules, and the check is marked rules-only
//
import { expect, test } from '@playwright/test';
import { createScenarioFixture, signInParent } from './support';

test("S-010: The check still works without the Claude API", async ({ page }) => {
  const fixture = await createScenarioFixture({ withCheck: false });
  // Switch Claude off for this check, whether or not the test server has a key.
  await page.setExtraHTTPHeaders({ 'x-test-ai': 'off' });
  await signInParent(page, fixture);
  await page.goto('/');
  await page.getByTestId('start-check').click();
  await page.getByTestId('message-input').fill('I need gift cards today. Please do not tell anyone.');
  await page.getByTestId('submit-check').click();
  await expect(page.getByTestId('risk')).toContainText('Looks like a scam');
  await expect(page.getByTestId('waiting')).toContainText('Waiting for Alex');

  await page.waitForURL(/\/check\/[^/?#]+(?:[?#].*)?$/);

  const id = new URL(page.url()).pathname.split('/').at(-1)!;
  const result = await page.evaluate(async (checkId) => {
    const response = await fetch(`/api/checks/${encodeURIComponent(checkId)}`, { cache: 'no-store' });
    return await response.json() as { check: { engine: string; risk: string; flags: unknown[] } };
  }, id);
  expect(result.check.engine).toBe('rules-only');
  expect(result.check.risk).toBe('red');
  expect(result.check.flags.length).toBeGreaterThanOrEqual(2);
});
