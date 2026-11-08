import { clearedMfaCookie } from '@/lib/server/auth';
import { assertSameOrigin, errorResponse, safeErr } from '@/lib/server/http';
import { piezas } from '@/lib/server/piezas';
import { clearedSessionCookie, sessionTokenFrom } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/signout: ends the session in Piezas and clears the cookies.
// Refused when another site sends it, so a scam page can't sign the parent out.
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (err) {
    return errorResponse(err);
  }
  const token = sessionTokenFrom(request);
  if (token) {
    await piezas()
      .users.signOut(token)
      .catch((err: unknown) => console.error('[auth] sign-out failed', safeErr(err)));
  }
  const response = Response.json({ status: 'signed_out' });
  response.headers.append('set-cookie', clearedSessionCookie());
  response.headers.append('set-cookie', clearedMfaCookie());
  return response;
}
