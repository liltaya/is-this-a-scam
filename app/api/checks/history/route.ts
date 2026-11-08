import type { EntityRecord } from '@piezas/sdk';
import { recordCheckView } from '@/lib/server/audit';
import { errorResponse, HttpError, notFound } from '@/lib/server/http';
import { clearIfOverdue } from '@/lib/server/retention';
import { records } from '@/lib/server/piezas';
import { requireViewer, withSession } from '@/lib/server/session';
import { findPairFor, toCheck } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;
const MAX_OFFSET = 1_000_000;

function pageNumber(value: string | null, fallback: number, name: string, max: number): number {
  if (value === null) return fallback;
  if (!/^(0|[1-9]\d*)$/.test(value)) {
    throw new HttpError(400, 'invalid_input', `Please check the ${name} value.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > max) {
    throw new HttpError(400, 'invalid_input', `Please check the ${name} value.`);
  }
  return parsed;
}

// GET /api/checks/history: the signed-in helper's own parent's checks only.
export async function GET(request: Request) {
  try {
    const viewer = await requireViewer(request);
    const mine = await findPairFor(viewer);
    if (!mine || mine.role !== 'helper') throw notFound();

    const url = new URL(request.url);
    const limit = pageNumber(url.searchParams.get('limit'), DEFAULT_LIMIT, 'page size', MAX_LIMIT);
    const offset = pageNumber(url.searchParams.get('offset'), 0, 'page', MAX_OFFSET);
    if (limit < 1) throw new HttpError(400, 'invalid_input', 'Please check the page size.');

    const { check } = await records();
    const page = await check.list({
      filter: { pairId: mine.pair.id },
      sort: 'created_at',
      order: 'desc',
      limit,
      offset,
    });

    // Recheck the pair boundary locally, even though the list query is filtered.
    const owned = page.data.filter(
      (record: EntityRecord) => !record.deletedAt && record.data.pairId === mine.pair.id,
    );
    const fresh = await Promise.all(owned.map((record) => clearIfOverdue(record)));
    await Promise.all(fresh.map((record) => recordCheckView(viewer, record.id, mine.role)));

    const nextOffset = page.data.length === limit ? offset + page.data.length : null;
    const response = Response.json({ checks: fresh.map(toCheck), nextOffset });
    response.headers.set('Cache-Control', 'private, no-store');
    return withSession(viewer, response);
  } catch (err) {
    return errorResponse(err);
  }
}
