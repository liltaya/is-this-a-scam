import { timingSafeEqual } from 'node:crypto';
import { errorResponse, HttpError } from '@/lib/server/http';
import { runRetention } from '@/lib/server/retention';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/jobs/retention: the nightly 30-day clean-up. Not for people: called
// by the scheduled GitHub workflow (.github/workflows/retention.yml) with
// `Authorization: Bearer $RETENTION_SECRET`. Safe to run more than once.
function authorized(request: Request): boolean {
  const secret = process.env.RETENTION_SECRET;
  if (!secret || secret.length < 32) return false;
  const given = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    if (!authorized(request)) throw new HttpError(404, 'not_found', 'Not found.');
    const result = await runRetention();
    console.log('[retention] done', result);
    // Any check left uncleared is a failure, so the scheduled job turns red.
    return Response.json(result, { status: result.failed ? 500 : 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
