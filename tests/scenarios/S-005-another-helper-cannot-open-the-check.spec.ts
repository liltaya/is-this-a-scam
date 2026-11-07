// piezas-scenario: S-005 v=ad2bc71315c8
// S-005: Another helper cannot open the check
//   Given a check from Galina and a different helper with their own parent
//   When that helper opens the check's link
//   Then they see "not found", and Alex's earlier view of the check appears in the audit trail
//
// NOT WRITTEN YET. Replace the test body with the real steps, driven against
// the running app: open the page (page.goto), do what the When line says
// (click, fill, ...), and check what the Then line says is visible
// (await expect(page.getByTestId(...)).toBeVisible() / toHaveText(...)).
// Keep the first line: it tells Piezas which scenario (and which wording of
// it) this test checks. Never skip the test or fake Piezas.
import { test } from '@playwright/test';

test("S-005: Another helper cannot open the check", async () => {
  throw new Error("PIEZAS_NOT_WRITTEN: S-005 has no test yet");
});
