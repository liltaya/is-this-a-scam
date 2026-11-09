import 'server-only';
import type { ApiError } from '@/lib/contracts';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const notFound = () =>
  new HttpError(404, 'not_found', 'That check was not found.');

/**
 * What may be logged about an error: its kind and code only. Error messages
 * from services can echo the request (and so message text), so they are never logged.
 */
export function safeErr(err: unknown): { name: string; code?: string; service?: string; operation?: string } {
  const e = err as { name?: unknown; code?: unknown; service?: unknown; operation?: unknown } | null;
  const s = (v: unknown) => (typeof v === 'string' ? v : undefined);
  return { name: s(e?.name) ?? typeof err, code: s(e?.code), service: s(e?.service), operation: s(e?.operation) };
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    const body: ApiError = { error: { code: err.code, message: err.message } };
    return Response.json(body, { status: err.status });
  }
  console.error('[api] unexpected error', safeErr(err));
  const body: ApiError = {
    error: { code: 'server_error', message: 'Something went wrong on our side. Please try again.' },
  };
  return Response.json(body, { status: 500 });
}

/**
 * Refuses a POST that a browser sent from another site. SameSite=Lax cookies
 * are not enough here: other apps on apps.piezas.ai count as the same site, and
 * a cross-site form can still sign a phone in to a scammer's account (login
 * CSRF). Browsers send Sec-Fetch-Site; older ones send Origin. Requests with
 * neither (tests, curl) carry no cookies of ours by accident, so they pass.
 */
export function assertSameOrigin(request: Request): void {
  const refuse = () => new HttpError(403, 'bad_origin', 'Please open the app directly and try again.');
  const site = request.headers.get('sec-fetch-site');
  if (site) {
    if (site === 'same-origin' || site === 'none') return;
    throw refuse();
  }
  const origin = request.headers.get('origin');
  if (!origin) return;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw refuse();
  }
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').split(',')[0].trim();
  if (!host || originHost !== host) throw refuse();
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {}
  throw new HttpError(400, 'invalid_input', 'That request was not readable. Please try again.');
}
