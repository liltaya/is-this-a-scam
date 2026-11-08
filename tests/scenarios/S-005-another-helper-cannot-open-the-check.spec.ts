// piezas-scenario: S-005 v=ad2bc71315c8
// S-005: Another helper cannot open the check
//   Given a check from Galina and a different helper with their own parent
//   When that helper opens the check's link
//   Then they see "not found", and Alex's earlier view of the check appears in the audit trail
//
import { expect, test } from '@playwright/test';
import { createScenarioFixture, hasHelperViewAudit, signInHelper } from './support';

test("S-005: Another helper cannot open the check", async ({ page }) => {
  const owner = await createScenarioFixture();
  await signInHelper(page, owner);
  await page.goto(`/helper/checks/${encodeURIComponent(owner.check!.id)}`);
  await expect(page.getByTestId('masked-text')).toBeVisible();
  await expect.poll(() => hasHelperViewAudit(owner)).toBe(true);

  const outsider = await createScenarioFixture();
  await signInHelper(page, outsider);
  await page.goto(`/helper/checks/${encodeURIComponent(owner.check!.id)}`);
  await expect(page.getByTestId('review-error')).toContainText(/not found/i);
});
