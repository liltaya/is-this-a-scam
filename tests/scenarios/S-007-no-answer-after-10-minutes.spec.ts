// piezas-scenario: S-007 v=d5afc386d18f
// S-007: No answer after 10 minutes
//   Given a check that has been pending for 10 minutes
//   When Galina looks at her result screen
//   Then she sees "Don't pay or reply until you talk to someone you trust" and a button to call Alex
//
// NOT WRITTEN YET. Replace the test body with the real steps, driven against
// the running app: open the page (page.goto), do what the When line says
// (click, fill, ...), and check what the Then line says is visible
// (await expect(page.getByTestId(...)).toBeVisible() / toHaveText(...)).
// Keep the first line: it tells Piezas which scenario (and which wording of
// it) this test checks. Never skip the test or fake Piezas.
import { test } from '@playwright/test';

test("S-007: No answer after 10 minutes", async () => {
  throw new Error("PIEZAS_NOT_WRITTEN: S-007 has no test yet");
});
