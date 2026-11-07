// piezas-scenario: S-010 v=77e4bc4a1460
// S-010: The check still works without the Claude API
//   Given the Claude API cannot be reached
//   When Galina submits the gift card message
//   Then she still gets a red result from the keyword rules, and the check is marked rules-only
//
// NOT WRITTEN YET. Replace the test body with the real steps, driven against
// the running app: open the page (page.goto), do what the When line says
// (click, fill, ...), and check what the Then line says is visible
// (await expect(page.getByTestId(...)).toBeVisible() / toHaveText(...)).
// Keep the first line: it tells Piezas which scenario (and which wording of
// it) this test checks. Never skip the test or fake Piezas.
import { test } from '@playwright/test';

test("S-010: The check still works without the Claude API", async () => {
  throw new Error("PIEZAS_NOT_WRITTEN: S-010 has no test yet");
});
