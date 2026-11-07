import 'server-only';
import type { ApiError } from '@/lib/contracts';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const notFound = () =>
  new HttpError(404, 'not_found', "We couldn't find that check.");

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    const body: ApiError = { error: { code: err.code, message: err.message } };
    return Response.json(body, { status: err.status });
  }
  console.error('[api] unexpected error', err);
  const body: ApiError = {
    error: { code: 'server_error', message: 'Something went wrong on our side. Please try again.' },
  };
  return Response.json(body, { status: 500 });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {}
  throw new HttpError(400, 'invalid_input', 'That request was not readable. Please try again.');
}
