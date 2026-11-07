import { errorResponse, HttpError } from '@/lib/server/http';
import { requireViewer, withSession } from '@/lib/server/session';
import { findPairFor } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/pair: parent or helper. Names and the helper's phone for the call button.
export async function GET(request: Request) {
  try {
    const viewer = await requireViewer(request);
    const mine = await findPairFor(viewer);
    if (!mine) throw new HttpError(404, 'not_found', 'Your account is not linked to a parent or helper yet.');
    return withSession(viewer, Response.json({ pair: mine.pair }));
  } catch (err) {
    return errorResponse(err);
  }
}
