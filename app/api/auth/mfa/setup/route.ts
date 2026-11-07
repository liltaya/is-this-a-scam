import { statusFor } from '@/lib/server/auth';
import { HttpError, errorResponse } from '@/lib/server/http';
import { piezas } from '@/lib/server/piezas';
import { requireViewer, withSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/mfa/setup: a signed-in helper turns on sign-in codes by email
// (R-002). From then on every sign-in emails a 6-digit code. Enrollment is done
// by Piezas; the app never sees or stores any second-factor secret.
export async function POST(request: Request) {
  try {
    const viewer = await requireViewer(request);
    if (viewer.profileRole !== 'helper') {
      throw new HttpError(403, 'not_allowed', 'Only helpers set up sign-in codes.');
    }
    const users = piezas().users;
    const status = await users.getMfaStatus(viewer.token);
    if (!status.factors.some((f) => f.confirmed)) {
      try {
        await users.enableEmailMfa(viewer.token);
      } catch (err) {
        if ((err as { code?: string })?.code === 'validation_failed') {
          throw new HttpError(400, 'email_not_verified', 'Please confirm your email first, then turn on sign-in codes.');
        }
        throw err;
      }
    }
    const body = await statusFor(viewer.token, viewer.userId, viewer.profileRole);
    return withSession(viewer, Response.json(body));
  } catch (err) {
    return errorResponse(err);
  }
}
