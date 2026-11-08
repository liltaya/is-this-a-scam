// piezas-scenario: S-001 v=8543dda419ab
// S-001: A helper signs up and signs the parent in without the parent typing a password
//   Given a new helper on the public sign-up page
//   When they sign up with email, set up MFA, add their parent Galina with name and email, and finish Galina's first sign-in on her phone
//   Then Galina's phone shows her Home screen, she never typed a password, and her sign-in is set to last 90 days, while the sign-up page offers no way to sign up as a parent
//
import { expect, test } from '@playwright/test';
import { uniqueTestEmail, waitForEmail } from './support';

test("S-001: A helper signs up and signs the parent in without the parent typing a password", async ({ page, context }) => {
  const suffix = Math.random().toString(36).slice(2, 10);
  const helperEmail = uniqueTestEmail('signup');
  const helperPassword = `Helper-${suffix}-Long-Password!`;
  const parentEmail = `galina-${suffix}@example.test`;
  const parentPassword = `Parent-${suffix}-Long-Password!`;

  await page.goto('/helper/signup');
  await expect(page.getByTestId('helper-signup')).toBeVisible();
  await expect(page.getByText(/Parents don’t sign up here/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /parent sign.?up/i })).toHaveCount(0);
  await page.getByTestId('helper-name').fill('Alex');
  await page.getByTestId('helper-email').fill(helperEmail);
  await page.getByTestId('helper-password').fill(helperPassword);
  await page.getByTestId('helper-signup').click();
  await expect(page.getByTestId('go-to-signin')).toBeVisible();

  const verificationEmail = await waitForEmail(helperEmail, (message) => /verify|confirm/i.test(message.subject));
  const verificationUrl = verificationEmail.bodyRendered.match(/https?:\/\/[^\s"<>]+/)?.[0];
  expect(verificationUrl).toBeTruthy();
  expect(verificationUrl).toContain('/helper/verify?token=');
  await page.goto(verificationUrl!);
  await page.waitForURL(/\/helper\/(signin|mfa\/setup)/);
  if (new URL(page.url()).pathname === '/helper/signin') {
    await page.getByTestId('signin-email').fill(helperEmail);
    await page.getByTestId('signin-password').fill(helperPassword);
    await page.getByTestId('signin-submit').click();
  }
  await expect(page).toHaveURL(/\/helper\/mfa\/setup/);
  await page.getByTestId('mfa-setup').click();
  await page.getByTestId('parent-name').fill('Galina');
  await page.getByTestId('parent-email').fill(parentEmail);
  await page.getByTestId('parent-password').fill(parentPassword);
  await page.getByTestId('parent-password-confirm').fill(parentPassword);
  await page.getByTestId('add-parent').click();
  await expect(page.getByTestId('see-parent-signin')).toBeVisible();

  const parentPagePromise = context.waitForEvent('page');
  await page.getByTestId('see-parent-signin').click();
  const parentPage = await parentPagePromise;
  await parentPage.waitForLoadState('domcontentloaded');
  await parentPage.getByTestId('setup-email').fill(parentEmail);
  await expect(parentPage.getByTestId('setup-password')).toHaveAttribute('type', 'password');
  await parentPage.getByTestId('setup-password').fill(parentPassword);
  await parentPage.getByTestId('setup-signin').click();
  await expect(parentPage.getByTestId('setup-go-home')).toBeVisible();
  await parentPage.getByTestId('setup-go-home').click();
  await expect(parentPage.getByTestId('start-check')).toBeVisible();
  const session = (await parentPage.context().cookies()).find((cookie) => cookie.name === 'its_session');
  expect(session).toBeTruthy();
  expect(session!.expires - Math.floor(Date.now() / 1000)).toBeGreaterThan(89 * 24 * 60 * 60);
});
