// piezas-scenario: S-002 v=07a53059a519
// S-002: The parent checks the gift card message
//   Given Galina signed in on her Home screen
//   When she taps "Is this a scam?" and pastes the gift card message
//   Then the result shows risk red with at least two flags and "Waiting for Alex", and Alex gets one email with Galina's name, a risk label and a sign-in link that does not contain the message text
//
// NOT WRITTEN YET. Replace the test body with the real steps, driven against
// the running app: open the page (page.goto), do what the When line says
// (click, fill, ...), and check what the Then line says is visible
// (await expect(page.getByTestId(...)).toBeVisible() / toHaveText(...)).
// Keep the first line: it tells Piezas which scenario (and which wording of
// it) this test checks. Never skip the test or fake Piezas.
import { test } from '@playwright/test';

test("S-002: The parent checks the gift card message", async () => {
  throw new Error("PIEZAS_NOT_WRITTEN: S-002 has no test yet");
});
