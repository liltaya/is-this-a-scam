import { signInError, signedIn } from '@/lib/server/auth';
import { HttpError, errorResponse, readJson } from '@/lib/server/http';
import { piezas } from '@/lib/server/piezas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/verify-email: the helper's /helper/verify page sends the token
// from the emailed link. Confirms the email and, when Piezas allows it, signs
// the helper straight in.
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!token) throw new HttpError(400, 'invalid_input', 'That link is missing a part. Please open it from the email again.');

    let result;
    try {
      result = await piezas().users.confirmEmailVerification(token);
    } catch (err) {
      if ((err as { code?: string })?.code === 'invalid_link') {
        throw new HttpError(400, 'invalid_link', 'That link has expired. Please sign in and we will send a new one.');
      }
      signInError(err);
    }
    if (result.session) return signedIn({ user: result.user, session: result.session });
    return Response.json({ status: 'verified' });
  } catch (err) {
    return errorResponse(err);
  }
}
