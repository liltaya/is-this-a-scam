import { clearedMfaCookie, mfaTokenFrom, signInError, signedIn } from '@/lib/server/auth';
import { assertSameOrigin, HttpError, errorResponse, readJson } from '@/lib/server/http';
import { piezas } from '@/lib/server/piezas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/mfa/verify: the second sign-in step. The code is the 6 digits
// Piezas emailed (or from an authenticator app).
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const challenge = mfaTokenFrom(request);
    if (!challenge) throw new HttpError(401, 'expired', 'That step took too long. Please sign in again.');
    const body = await readJson(request);
    const code = typeof body.code === 'string' ? body.code.replace(/\s/g, '') : '';
    if (!/^\d{6,8}$/.test(code)) throw new HttpError(400, 'invalid_code', 'Please enter the 6-digit code.');

    let result;
    try {
      result = await piezas().users.completeMfaChallenge(challenge, code);
    } catch (err) {
      signInError(err);
    }
    return signedIn(result, [clearedMfaCookie()]);
  } catch (err) {
    return errorResponse(err);
  }
}
