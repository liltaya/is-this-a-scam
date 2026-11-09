// piezas-scenario: S-007 v=d5afc386d18f
// S-007: No answer after 10 minutes
//   Given a check that has been pending for 10 minutes
//   When Galina looks at her result screen
//   Then she sees "Don't pay or reply until you talk to someone you trust" and a button to call Alex
//
import { expect, test } from '@playwright/test';
import { createScenarioFixture, signInParent } from './support';

test("S-007: No answer after 10 minutes", async ({ page }) => {
  const fixture = await createScenarioFixture({ helperPhone: '+1 604 555 0147' });
  await signInParent(page, fixture);
  await page.clock.install({ time: new Date(Date.parse(fixture.check!.createdAt) + 11 * 60 * 1000) });
  await page.goto(`/check/${encodeURIComponent(fixture.check!.id)}`);
  await expect(page.getByTestId('fallback')).toContainText("Don't pay or reply until you talk to someone you trust.");
  await expect(page.getByTestId('call-helper')).toHaveAttribute('href', 'tel:+16045550147');
});
