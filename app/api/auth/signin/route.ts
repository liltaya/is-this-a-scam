import type { MfaRequired } from '@/lib/contracts';
import {
  ensureAuthPolicy,
  mfaChallengeCookie,
  requireEmail,
  signInError,
  signedIn,
  trustedAppUrl,
} from '@/lib/server/auth';
import { assertSameOrigin, HttpError, errorResponse, readJson } from '@/lib/server/http';
import { piezas } from '@/lib/server/piezas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/signin: helpers and parents. Also used once on the parent's
// phone, where the helper types the parent's password (R-004).
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJson(request);
    const email = requireEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) throw new HttpError(400, 'invalid_input', 'Please enter the password.');

    await ensureAuthPolicy(request);
    const users = piezas().users;
    let result;
    try {
      result = await users.signIn({ email, password });
    } catch (err) {
      if ((err as { code?: string })?.code === 'account_pending') {
        // Send a fresh confirmation link so the helper isn't stuck.
        const appUrl = trustedAppUrl(request);
        await users
          .requestEmailVerification(email, appUrl ? { returnUrl: `${appUrl}/helper/verify` } : undefined)
          .catch((e: unknown) => console.error('[auth] could not resend verification', (e as { code?: string })?.code));
      }
      signInError(err);
    }

    // Accounts with a sign-in code get a second step. The challenge stays in an
    // HttpOnly cookie; the page only learns that a code is needed.
    if (result.mfa) {
      const body: MfaRequired = { status: 'mfa_required', factors: result.mfa.factors };
      const response = Response.json(body);
      response.headers.append('set-cookie', mfaChallengeCookie(result.mfa.challengeToken));
      return response;
    }
    return signedIn(result);
  } catch (err) {
    return errorResponse(err);
  }
}
