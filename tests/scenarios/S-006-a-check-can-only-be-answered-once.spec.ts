// piezas-scenario: S-006 v=bd5c69af515e
// S-006: A check can only be answered once
//   Given a check that Alex already answered "Scam"
//   When Alex tries to answer it again
//   Then the answer is refused and the check still says "Scam"
//
// NOT WRITTEN YET. Replace the test body with the real steps, driven against
// the running app: open the page (page.goto), do what the When line says
// (click, fill, ...), and check what the Then line says is visible
// (await expect(page.getByTestId(...)).toBeVisible() / toHaveText(...)).
// Keep the first line: it tells Piezas which scenario (and which wording of
// it) this test checks. Never skip the test or fake Piezas.
import { test } from '@playwright/test';

test("S-006: A check can only be answered once", async () => {
  throw new Error("PIEZAS_NOT_WRITTEN: S-006 has no test yet");
});
