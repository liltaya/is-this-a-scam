// piezas-scenario: S-003 v=0c7342b4ae9e
// S-003: The helper's answer reaches the parent within 5 seconds
//   Given a pending check from Galina with her result screen open
//   When Alex opens it from the email link and taps "Scam"
//   Then Alex sees "Sent. Galina sees your answer now." and Galina's screen shows "Scam. Don't reply or pay." within 5 seconds
//
// NOT WRITTEN YET. Replace the test body with the real steps, driven against
// the running app: open the page (page.goto), do what the When line says
// (click, fill, ...), and check what the Then line says is visible
// (await expect(page.getByTestId(...)).toBeVisible() / toHaveText(...)).
// Keep the first line: it tells Piezas which scenario (and which wording of
// it) this test checks. Never skip the test or fake Piezas.
import { test } from '@playwright/test';

test("S-003: The helper's answer reaches the parent within 5 seconds", async () => {
  throw new Error("PIEZAS_NOT_WRITTEN: S-003 has no test yet");
});
