// piezas-scenario: S-001 v=8543dda419ab
// S-001: A helper signs up and signs the parent in without the parent typing a password
//   Given a new helper on the public sign-up page
//   When they sign up with email, set up MFA, add their parent Galina with name and email, and finish Galina's first sign-in on her phone
//   Then Galina's phone shows her Home screen, she never typed a password, and her sign-in is set to last 90 days, while the sign-up page offers no way to sign up as a parent
//
// NOT WRITTEN YET. Replace the test body with the real steps, driven against
// the running app: open the page (page.goto), do what the When line says
// (click, fill, ...), and check what the Then line says is visible
// (await expect(page.getByTestId(...)).toBeVisible() / toHaveText(...)).
// Keep the first line: it tells Piezas which scenario (and which wording of
// it) this test checks. Never skip the test or fake Piezas.
import { test } from '@playwright/test';

test("S-001: A helper signs up and signs the parent in without the parent typing a password", async () => {
  throw new Error("PIEZAS_NOT_WRITTEN: S-001 has no test yet");
});
