import { recordCheckView } from '@/lib/server/audit';
import { errorResponse } from '@/lib/server/http';
import { clearIfOverdue } from '@/lib/server/retention';
import { requireViewer, withSession } from '@/lib/server/session';
import { loadCheckFor, toCheck } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/checks/:id: parent or helper of the pair; anyone else gets 404.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer(request);
    const { id } = await params;
    const { record, role } = await loadCheckFor(viewer, id);
    const fresh = await clearIfOverdue(record);
    await recordCheckView(viewer, record.id, role);
    return withSession(viewer, Response.json({ check: toCheck(fresh) }));
  } catch (err) {
    return errorResponse(err);
  }
}
