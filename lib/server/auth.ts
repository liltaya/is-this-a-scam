import 'server-only';
import type { SignInResult } from '@piezas/sdk';
import type { AuthStatus, Role } from '@/lib/contracts';
import { HttpError } from './http';
import { piezas } from './piezas';
import { SESSION_MAX_AGE, sessionCookie } from './session';
import { findPairFor } from './store';

// Sign-in and setup glue around the Piezas users service. Accounts, passwords,
// sessions and MFA all live in Piezas; nothing here stores a credential.

export const MIN_PASSWORD = 12;
/** Holds the short-lived MFA challenge between the two sign-in steps. Never readable by the page. */
export const MFA_COOKIE = 'its_mfa';
const MFA_MAX_AGE = 10 * 60;

const errCode = (err: unknown) => (err as { code?: string })?.code;

/**
 * The app's public address, trusted only when it comes from settings
 * (PIEZAS_APP_URL): used for the confirmation link and as the sign-in rules'
 * allowed origin. Never taken from the request, even on localhost: a request
 * header can be faked, and a teammate running the live key on their laptop
 * would otherwise point the live app's allowed origin at their machine, after
 * which no helper on the live site gets a confirmation email. Without the
 * setting, Piezas's own link is used; it opens /verify, which forwards to
 * /helper/verify. The test copy sets it to its own address (playwright.config.ts).
 */
export function trustedAppUrl(): string | null {
  const set = process.env.PIEZAS_APP_URL;
  return set ? set.replace(/\/$/, '') : null;
}

const RESEND_GAP_MS = 10 * 60 * 1000;
const lastVerificationEmail = new Map<string, number>();

/**
 * Emails a confirmation link, at most once every 10 minutes per address (per
 * server process). Sign-in used to send a new one on every try while the email
 * was unconfirmed, so a helper could get several emails with different links.
 */
export async function sendVerificationEmail(email: string): Promise<void> {
  const now = Date.now();
  const last = lastVerificationEmail.get(email);
  if (last !== undefined && now - last < RESEND_GAP_MS) return;
  for (const [key, at] of lastVerificationEmail) if (now - at >= RESEND_GAP_MS) lastVerificationEmail.delete(key);
  lastVerificationEmail.set(email, now);
  // The link opens our /helper/verify page when the app's address is known.
  // Otherwise Piezas links to /verify, which forwards there (app/verify).
  const appUrl = trustedAppUrl();
  try {
    await piezas().users.requestEmailVerification(email, appUrl ? { returnUrl: `${appUrl}/helper/verify` } : undefined);
  } catch (err) {
    lastVerificationEmail.delete(email); // let the next try send it
    throw err;
  }
}

let policyReady: Promise<void> | undefined;

/**
 * Sets the sign-in rules once per server process, before the first sign-up:
 * helpers verify their email, sessions last 90 days (R-005), passwords are at
 * least 12 characters, and accounts with MFA get a second step.
 */
export function ensureAuthPolicy(): Promise<void> {
  if (!policyReady) {
    policyReady = (async () => {
      const users = piezas().users;
      const appUrl = trustedAppUrl();
      const base = {
        requireEmailVerification: true,
        passwordMinLength: MIN_PASSWORD,
        mfa: 'optional' as const,
        ...(appUrl ? { allowedOrigins: [new URL(appUrl).origin] } : {}),
      };
      try {
        await users.configurePolicy({ ...base, sessionTtlSeconds: SESSION_MAX_AGE });
      } catch (err) {
        // Piezas doesn't document its longest session. If 90 days is refused,
        // keep its default length rather than block sign-in.
        if (errCode(err) !== 'validation_failed') throw err;
        // Loud on purpose: the owner needs to know parents may be signed out early.
        console.error(
          '[auth] OWNER ACTION NEEDED: Piezas refused 90-day sessions (R-005). Parents will be signed out after the Piezas default session length.',
        );
        await users.configurePolicy(base);
      }
    })().catch((err) => {
      policyReady = undefined; // let the next request try again
      throw err;
    });
  }
  return policyReady;
}

export function requirePassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < MIN_PASSWORD) {
    throw new HttpError(400, 'invalid_input', `Please use a password of at least ${MIN_PASSWORD} characters.`);
  }
  if (value.length > 200) throw new HttpError(400, 'invalid_input', 'That password is too long.');
  return value;
}

export function requireEmail(value: unknown): string {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, 'invalid_input', 'Please check the email address.');
  }
  return email;
}

export function requireName(value: unknown, what: string): string {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 60) throw new HttpError(400, 'invalid_input', `Please enter ${what}.`);
  return name;
}

/** Turns a Piezas sign-in failure into the plain words the screen shows. */
export function signInError(err: unknown): never {
  switch (errCode(err)) {
    case 'invalid_credentials':
      throw new HttpError(401, 'invalid_credentials', "That email or password didn't match. Please try again.");
    case 'account_pending':
      throw new HttpError(403, 'email_not_verified', 'Please confirm your email first. Check your inbox for our link.');
    case 'invalid_code':
      throw new HttpError(400, 'invalid_code', "That code didn't work. Please check it and try again.");
    case 'invalid_session':
    case 'invalid_link':
      throw new HttpError(401, 'expired', 'That step took too long. Please start again.');
    case 'rate_limited':
      throw new HttpError(429, 'rate_limited', 'Too many tries. Please wait a few minutes and try again.');
    default:
      throw err;
  }
}

/** What the screens need after any sign-in step, so they know where to go next. */
export async function statusFor(token: string, userId: string, profileRole: Role | null): Promise<AuthStatus> {
  const p = piezas();
  const viewerLike = { userId, tenantId: '', email: '', profileRole, profileName: '', token };
  const mine = await findPairFor(viewerLike);
  const role: Role | null = mine?.role ?? profileRole;
  let mfaEnabled = false;
  if (role === 'helper') {
    const status = await p.users.getMfaStatus(token);
    mfaEnabled = status.factors.some((f) => f.confirmed);
  }
  return {
    status: 'signed_in',
    role,
    mfaEnabled,
    needsMfaSetup: role === 'helper' && !mfaEnabled,
    pair: mine?.pair ?? null,
  };
}

/** Finishes a sign-in: sets the session cookie and answers with the next step. */
export async function signedIn(result: SignInResult, extraCookies: string[] = []): Promise<Response> {
  if (!result.session || !result.user) throw new Error('Piezas sign-in returned no session');
  const profile = result.user.profile ?? {};
  const profileRole = profile.role === 'parent' || profile.role === 'helper' ? profile.role : null;
  const body = await statusFor(result.session.token, result.user.id, profileRole);
  const response = Response.json(body);
  response.headers.append('set-cookie', sessionCookie(result.session.token));
  for (const c of extraCookies) response.headers.append('set-cookie', c);
  return response;
}

export function mfaChallengeCookie(challengeToken: string): string {
  return `${MFA_COOKIE}=${encodeURIComponent(challengeToken)}; Path=/api/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=${MFA_MAX_AGE}`;
}

export function clearedMfaCookie(): string {
  return `${MFA_COOKIE}=; Path=/api/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function mfaTokenFrom(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === MFA_COOKIE) return decodeURIComponent(rest.join('=')) || null;
  }
  return null;
}
