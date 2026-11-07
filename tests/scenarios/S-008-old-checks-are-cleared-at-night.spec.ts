// piezas-scenario: S-008 v=55eed955dd6d
// S-008: Old checks are cleared at night
//   Given a check older than 30 days with risk red and helper answer scam
//   When the nightly 3:00 a.m. Vancouver clean-up runs
//   Then its masked text and flag quotes and explanations are blank, "text cleared at" is set, and its risk and helper answer are unchanged
//
// NOT WRITTEN YET. Replace the test body with the real steps, driven against
// the running app: open the page (page.goto), do what the When line says
// (click, fill, ...), and check what the Then line says is visible
// (await expect(page.getByTestId(...)).toBeVisible() / toHaveText(...)).
// Keep the first line: it tells Piezas which scenario (and which wording of
// it) this test checks. Never skip the test or fake Piezas.
import { test } from '@playwright/test';

test("S-008: Old checks are cleared at night", async () => {
  throw new Error("PIEZAS_NOT_WRITTEN: S-008 has no test yet");
});
