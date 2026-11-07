import 'server-only';
import { piezas } from './piezas';
import { HttpError } from './http';

// The Piezas session token travels either as `Authorization: Bearer <token>`
// or in this cookie. The setup/sign-in routes (decided at Checkpoint 1) set it.
export const SESSION_COOKIE = 'its_session';

export interface Viewer {
  userId: string;
  tenantId: string;
  email: string;
  /** Present when Piezas slid the session forward; routes send it back. */
  refreshedToken?: string;
}

function tokenFrom(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim() || null;
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join('=')) || null;
  }
  return null;
}

// Identity comes only from the verified Piezas session, never from the request body.
export async function requireViewer(request: Request): Promise<Viewer> {
  const token = tokenFrom(request);
  if (!token) throw new HttpError(401, 'signed_out', 'Please sign in again.');
  let result;
  try {
    result = await piezas().users.getSession(token);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'invalid_session' || code === 'unauthorized') {
      throw new HttpError(401, 'signed_out', 'Please sign in again.');
    }
    throw err;
  }
  if (!result.valid || !result.user || !result.claims) {
    throw new HttpError(401, 'signed_out', 'Please sign in again.');
  }
  if (result.user.status !== 'active') {
    throw new HttpError(401, 'signed_out', 'Please sign in again.');
  }
  return {
    userId: result.user.id,
    tenantId: result.claims.tenantId,
    email: result.user.email,
    refreshedToken: result.refreshedToken,
  };
}

export function withSession(viewer: Viewer, response: Response): Response {
  if (viewer.refreshedToken) {
    response.headers.append(
      'set-cookie',
      `${SESSION_COOKIE}=${encodeURIComponent(viewer.refreshedToken)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${90 * 24 * 3600}`,
    );
  }
  return response;
}
