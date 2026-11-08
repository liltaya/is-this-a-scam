import { statusFor } from '@/lib/server/auth';
import { errorResponse } from '@/lib/server/http';
import { requireViewer, withSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/auth/me: who is signed in and what they should see next.
export async function GET(request: Request) {
  try {
    const viewer = await requireViewer(request);
    const body = await statusFor(viewer.token, viewer.userId, viewer.profileRole);
    return withSession(viewer, Response.json({ ...body, name: viewer.profileName }));
  } catch (err) {
    return errorResponse(err);
  }
}
