// piezas-scenario: S-006 v=bd5c69af515e
// S-006: A check can only be answered once
//   Given a check that Alex already answered "Scam"
//   When Alex tries to answer it again
//   Then the answer is refused and the check still says "Scam"
//
import { expect, test } from '@playwright/test';
import { createScenarioFixture, signInHelper } from './support';

test("S-006: A check can only be answered once", async ({ page }) => {
  const fixture = await createScenarioFixture();
  await signInHelper(page, fixture);
  await page.goto(`/helper/checks/${encodeURIComponent(fixture.check!.id)}`);
  await expect(page.getByTestId('answer-scam')).toBeVisible();
  await page.getByTestId('answer-scam').click();
  await expect(page.getByTestId('sent')).toContainText('Sent. Galina sees your answer now.');

  await page.goto(`/helper/checks/${encodeURIComponent(fixture.check!.id)}`);
  await expect(page.getByTestId('already-answered')).toContainText('Scam');
  await expect(page.getByTestId('answer-scam')).toHaveCount(0);
});
