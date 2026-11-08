import { timingSafeEqual } from 'node:crypto';
import { errorResponse, HttpError, notFound } from '@/lib/server/http';
import { runRetention } from '@/lib/server/retention';
import { records } from '@/lib/server/piezas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/jobs/retention: the nightly 30-day clean-up. Not for people: called
// by the scheduled GitHub workflow (.github/workflows/retention.yml) with
// `Authorization: Bearer $RETENTION_SECRET`. Safe to run more than once.
function authorized(request: Request): boolean {
  const secret = process.env.RETENTION_SECRET;
  if (!secret || secret.length < 32) {
    // Say why in the server log (never the value), so a nightly run that gets
    // "Not found" can be traced to the setting instead of staying a mystery.
    console.error('[retention] RETENTION_SECRET is missing or shorter than 32 characters; the clean-up was refused');
    return false;
  }
  const given = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    if (!authorized(request)) throw new HttpError(404, 'not_found', 'Not found.');
    const url = new URL(request.url);
    const asOfValue = url.searchParams.get('asOf');
    const onlyCheckId = url.searchParams.get('checkId') || undefined;
    let asOf = new Date();
    if (asOfValue || onlyCheckId) {
      if (process.env.PIEZAS_TEST_RUN !== '1' || process.env.NODE_ENV === 'production' || !asOfValue || !onlyCheckId) {
        throw notFound();
      }
      asOf = new Date(asOfValue);
      if (!Number.isFinite(asOf.getTime())) throw new HttpError(400, 'invalid_input', 'The clean-up date is not valid.');
      const { check } = await records();
      await check.get(onlyCheckId); // Ensure the requested record exists in this test copy.
    }
    const result = await runRetention(asOf, onlyCheckId);
    console.log('[retention] done', result);
    // Any check left uncleared is a failure, so the scheduled job turns red.
    return Response.json(result, { status: result.failed ? 500 : 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
