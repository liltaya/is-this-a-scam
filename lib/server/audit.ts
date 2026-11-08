import 'server-only';
import { piezas } from './piezas';
import { safeErr } from './http';
import type { Viewer } from './session';

// R-020: every view of a check goes in the Piezas audit trail. The parent's
// waiting screen polls every 3 seconds, so repeat views by the same person
// within a minute are folded into one event (best effort, per server process).
const recent = new Map<string, number>();
const FOLD_MS = 60_000;

export async function recordCheckView(viewer: Viewer, checkId: string, role: string): Promise<void> {
  const key = `${viewer.userId}:${checkId}`;
  const now = Date.now();
  if (now - (recent.get(key) ?? 0) < FOLD_MS) return;
  recent.set(key, now);
  if (recent.size > 5000) {
    for (const [k, t] of recent) if (now - t >= FOLD_MS) recent.delete(k);
  }
  try {
    await piezas().admin.createAuditEvent(viewer.tenantId, {
      actorId: viewer.userId,
      actorType: 'app_user',
      action: 'check.viewed',
      resourceType: 'check',
      resourceId: checkId,
      metadata: { role },
    });
  } catch (err) {
    recent.delete(key); // try again on the next view
    console.error('[audit] could not record check view', checkId, safeErr(err));
  }
}
