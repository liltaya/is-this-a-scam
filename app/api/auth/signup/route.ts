import { ensureAuthPolicy, requireEmail, requireName, requirePassword, trustedAppUrl } from '@/lib/server/auth';
import { assertSameOrigin, HttpError, errorResponse, readJson } from '@/lib/server/http';
import { piezas } from '@/lib/server/piezas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/signup: public, helpers only (R-001). Parents never sign up;
// their helper creates their account with POST /api/setup/parent.
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJson(request);
    const name = requireName(body.name, 'your first name');
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);

    await ensureAuthPolicy(request);
    const users = piezas().users;
    try {
      await users.signUp({ email, password, profile: { role: 'helper', name } });
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'conflict') {
        throw new HttpError(409, 'email_taken', 'That email already has an account. Please sign in instead.');
      }
      if ((err as { code?: string })?.code === 'validation_failed') {
        throw new HttpError(400, 'invalid_input', 'Please check your email and use a longer password.');
      }
      throw err;
    }

    // The account can't sign in until the email is confirmed. The link opens
    // our /helper/verify page when the app's address is known, or the Piezas
    // default page otherwise.
    const appUrl = trustedAppUrl(request);
    await users.requestEmailVerification(email, appUrl ? { returnUrl: `${appUrl}/helper/verify` } : undefined);

    return Response.json({ status: 'verify_email' }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
