// piezas-scenario: S-002 v=07a53059a519
// S-002: The parent checks the gift card message
//   Given Galina signed in on her Home screen
//   When she taps "Is this a scam?" and pastes the gift card message
//   Then the result shows risk red with at least two flags and "Waiting for Alex", and Alex gets one email with Galina's name, a risk label and a sign-in link that does not contain the message text
//
import { expect, test } from '@playwright/test';
import { alertMessagesForCheck, createScenarioFixture, signInHelper, signInParent } from './support';

test("S-002: The parent checks the gift card message", async ({ page }) => {
  const fixture = await createScenarioFixture({ withCheck: false });
  await signInParent(page, fixture);
  await page.goto('/');
  await page.getByTestId('start-check').click();
  await page.getByTestId('message-input').fill("Grandma, I need $900 in gift cards today. Please don't tell Mom.");
  const createResponse = page.waitForResponse((response) => response.url().endsWith('/api/checks') && response.request().method() === 'POST');
  await page.getByTestId('submit-check').click();
  const response = await createResponse;
  expect(response.ok()).toBeTruthy();
  const created = await response.json() as { check: { id: string }; helperNotified: boolean };
  expect(created.helperNotified).toBe(true);

  const alerts = await alertMessagesForCheck(fixture, created.check.id);
  expect(alerts).toHaveLength(1);
  const alert = alerts[0];
  expect(alert.subject).toContain('Galina');
  expect(alert.bodyRendered).toContain('Galina');
  expect(alert.bodyRendered).toContain('Several warning signs');
  expect(alert.bodyRendered).not.toContain('gift cards today');
  const reviewUrl = alert.bodyRendered.match(/https?:\/\/[^\s]+\/helper\/checks\/[^\s]+/)?.[0];
  expect(reviewUrl).toBeTruthy();
  expect(new URL(reviewUrl!).pathname).toBe(`/helper/checks/${encodeURIComponent(created.check.id)}`);
  expect(alert.bodyRendered).not.toContain('Grandma, I need $900');

  await expect(page.getByTestId('risk')).toContainText('Looks like a scam');
  await expect(page.getByTestId('flag')).toHaveCount(3);
  await expect(page.getByTestId('waiting')).toContainText('Waiting for Alex');

  await signInHelper(page, fixture);
  await page.goto(reviewUrl!);
  await expect(page.getByTestId('masked-text')).toContainText('gift cards');
  await expect(page.getByTestId('warning-flag')).toHaveCount(3);
});
