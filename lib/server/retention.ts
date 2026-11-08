import 'server-only';
import type { EntityRecord } from '@piezas/sdk';
import { records, piezas } from './piezas';
import { safeErr } from './http';
import { TEXT_KEPT_TAG, flagsJson, toCheck } from './store';

export const RETENTION_DAYS = 30;
const DAY_MS = 24 * 3600 * 1000;

export const isPastRetention = (createdAt: string, now = Date.now()) =>
  now - Date.parse(createdAt) > RETENTION_DAYS * DAY_MS;

/**
 * Clears one check's text (docs/contracts.md, SPEC R-021): masked text, each
 * flag's quote and explanation, the summary and the helper note are blanked and
 * the screenshot deleted; textClearedAt is set. Only the risk, flag types,
 * helper answer and timestamps stay. Returns the updated record.
 */
export async function clearCheckText(record: EntityRecord, now = new Date()): Promise<EntityRecord> {
  const { check } = await records();
  const current = toCheck(record);
  if (current.screenshotFileId) {
    try {
      await piezas().documents.deleteDocument(current.screenshotFileId);
    } catch (err) {
      console.error('[retention] could not delete screenshot', current.id, safeErr(err));
      throw err; // keep the tag so tomorrow's run tries again
    }
  }
  return check.update(record.id, {
    data: {
      ...record.data,
      maskedText: '',
      screenshotFileId: '',
      flagsJson: flagsJson(current.flags.map((f) => ({ ...f, quote: '', explain: '' }))),
      summary: '',
      helperNote: '',
      textClearedAt: current.textClearedAt ?? now.toISOString(),
    },
    tags: record.tags.filter((t) => t !== TEXT_KEPT_TAG),
  });
}

/** Used on every read, so an overdue check never shows its text even if a nightly run was missed. */
export async function clearIfOverdue(record: EntityRecord): Promise<EntityRecord> {
  if (record.tags.includes(TEXT_KEPT_TAG) && isPastRetention(record.createdAt)) {
    return clearCheckText(record);
  }
  return record;
}

/** The nightly job: clears every check older than 30 days that still has its text. */
export async function runRetention(now = new Date(), onlyCheckId?: string): Promise<{ cleared: number; failed: number }> {
  const { check } = await records();
  let cleared = 0;
  let failed = 0;
  if (onlyCheckId) {
    try {
      const record = await check.get(onlyCheckId);
      if (record.tags.includes(TEXT_KEPT_TAG) && isPastRetention(record.createdAt, now.getTime())) {
        await clearCheckText(record, now);
        cleared = 1;
      }
      return { cleared, failed };
    } catch {
      return { cleared, failed: 1 };
    }
  }
  const PAGE = 100;
  for (;;) {
    // Oldest first, only checks that still have text. Cleared ones drop out of
    // this list, so we always read from the start.
    const page = await check.list({ tag: TEXT_KEPT_TAG, sort: 'created_at', order: 'asc', limit: PAGE, offset: failed });
    const due = page.data.filter((r) => isPastRetention(r.createdAt, now.getTime()));
    for (const r of due) {
      try {
        await clearCheckText(r, now);
        cleared++;
      } catch {
        failed++;
      }
    }
    // Stop once a page has anything newer than 30 days, or the list ran out.
    if (due.length < page.data.length || page.data.length < PAGE || due.length === 0) break;
  }
  return { cleared, failed };
}
