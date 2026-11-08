// piezas-scenario: S-009 v=20b5651f39c7
// S-009: A normal message is never called safe by the app
//   Given Galina submits the pharmacy pickup message
//   When the result appears and Alex has not answered
//   Then the screen says "Waiting for Alex" and never "All good" or "safe", even though the risk is green
//
import { expect, test } from '@playwright/test';
import { createScenarioFixture, signInParent } from './support';

test("S-009: A normal message is never called safe by the app", async ({ page }) => {
  const fixture = await createScenarioFixture({ withCheck: false });
  await signInParent(page, fixture);
  await page.goto('/');
  await page.getByTestId('start-check').click();
  await page.getByTestId('message-input').fill('Kingsway Pharmacy: your prescription is ready for pickup. Questions? Call us at the store.');
  await page.getByTestId('submit-check').click();

  await expect(page.getByTestId('risk')).toContainText('No obvious warning signs');
  await expect(page.getByTestId('waiting')).toContainText('Waiting for Alex');
  await expect(page.getByTestId('helper-answer')).toHaveCount(0);
  await expect(page.getByText(/All good|safe/i)).toHaveCount(0);
});
