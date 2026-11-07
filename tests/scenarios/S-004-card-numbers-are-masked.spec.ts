// piezas-scenario: S-004 v=052e085f184d
// S-004: Card numbers are masked
//   Given Galina on the paste screen
//   When she submits a message containing 4111 1111 1111 1111
//   Then the saved check and every screen show  1111, and the full number appears nowhere, including what is sent to the Claude API
//
// NOT WRITTEN YET. Replace the test body with the real steps, driven against
// the running app: open the page (page.goto), do what the When line says
// (click, fill, ...), and check what the Then line says is visible
// (await expect(page.getByTestId(...)).toBeVisible() / toHaveText(...)).
// Keep the first line: it tells Piezas which scenario (and which wording of
// it) this test checks. Never skip the test or fake Piezas.
import { test } from '@playwright/test';

test("S-004: Card numbers are masked", async () => {
  throw new Error("PIEZAS_NOT_WRITTEN: S-004 has no test yet");
});
