// piezas-scenario: S-003 v=0c7342b4ae9e
// S-003: The helper's answer reaches the parent within 5 seconds
//   Given a pending check from Galina with her result screen open
//   When Alex opens it from the email link and taps "Scam"
//   Then Alex sees "Sent. Galina sees your answer now." and Galina's screen shows "Scam. Don't reply or pay." within 5 seconds
//
import { expect, test } from '@playwright/test';
import { createScenarioFixture, signInHelper, signInParent } from './support';

test("S-003: The helper's answer reaches the parent within 5 seconds", async ({ browser }) => {
  const fixture = await createScenarioFixture();
  const parentContext = await browser.newContext();
  const helperContext = await browser.newContext();
  const parentPage = await parentContext.newPage();
  const helperPage = await helperContext.newPage();

  await signInParent(parentPage, fixture);
  await parentPage.goto(`/check/${encodeURIComponent(fixture.check!.id)}`);
  await expect(parentPage.getByTestId('waiting')).toContainText('Waiting for Alex');

  await signInHelper(helperPage, fixture);
  await helperPage.goto(`/helper/checks/${encodeURIComponent(fixture.check!.id)}`);
  await expect(helperPage.getByTestId('masked-text')).toContainText(fixture.check!.maskedText!);
  const answeredAt = Date.now();
  await helperPage.getByTestId('answer-scam').click();
  await expect(helperPage.getByTestId('sent')).toContainText('Sent. Galina sees your answer now.');
  await expect(parentPage.getByTestId('helper-answer')).toContainText("Scam.", { timeout: 5000 });
  expect(Date.now() - answeredAt).toBeLessThan(5000);

  await parentContext.close();
  await helperContext.close();
});
