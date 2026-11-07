import { clearedMfaCookie } from '@/lib/server/auth';
import { piezas } from '@/lib/server/piezas';
import { clearedSessionCookie, sessionTokenFrom } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/signout: ends the session in Piezas and clears the cookies.
// Always succeeds from the screen's point of view.
export async function POST(request: Request) {
  const token = sessionTokenFrom(request);
  if (token) {
    await piezas()
      .users.signOut(token)
      .catch((err: unknown) => console.error('[auth] sign-out failed', (err as { code?: string })?.code));
  }
  const response = Response.json({ status: 'signed_out' });
  response.headers.append('set-cookie', clearedSessionCookie());
  response.headers.append('set-cookie', clearedMfaCookie());
  return response;
}
