import 'server-only';
import type { EntityRecord } from '@piezas/sdk';
import type { Check, Flag, HelperAnswer, Pair, Role } from '@/lib/contracts';
import { FLAG_TYPES } from '@/lib/contracts';
import { records } from './piezas';
import { notFound } from './http';
import type { Viewer } from './session';

// Checks whose text has not been cleared yet carry this tag, so the nightly
// clean-up lists only those.
export const TEXT_KEPT_TAG = 'text-kept';

const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);

export function toPair(r: EntityRecord): Pair {
  return {
    id: r.id,
    parentUserId: String(r.data.parentUserId ?? ''),
    helperUserId: String(r.data.helperUserId ?? ''),
    parentName: String(r.data.parentName ?? ''),
    helperName: String(r.data.helperName ?? ''),
    helperPhone: str(r.data.helperPhone),
    createdAt: r.createdAt,
  };
}

function parseFlags(raw: unknown): Flag[] {
  if (typeof raw !== 'string' || raw === '') return [];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.map((f) => ({
      type: FLAG_TYPES.includes(f?.type) ? f.type : 'other',
      quote: typeof f?.quote === 'string' ? f.quote : '',
      explain: typeof f?.explain === 'string' ? f.explain : '',
      source: f?.source === 'ai' ? 'ai' : 'rules',
    }));
  } catch {
    return [];
  }
}

export function toCheck(r: EntityRecord): Check {
  const d = r.data;
  return {
    id: r.id,
    pairId: String(d.pairId ?? ''),
    parentUserId: String(d.parentUserId ?? ''),
    maskedText: str(d.maskedText),
    screenshotFileId: str(d.screenshotFileId),
    risk: d.risk === 'red' || d.risk === 'yellow' ? d.risk : 'green',
    flags: parseFlags(d.flagsJson),
    summary: String(d.summary ?? ''),
    engine: d.engine === 'rules+ai' ? 'rules+ai' : 'rules-only',
    helperAnswer: (['scam', 'safe'].includes(d.helperAnswer as string) ? d.helperAnswer : 'pending') as HelperAnswer,
    helperNote: str(d.helperNote),
    createdAt: r.createdAt,
    answeredAt: str(d.answeredAt),
    textClearedAt: str(d.textClearedAt),
  };
}

export const flagsJson = (flags: Flag[]) => JSON.stringify(flags);

/** The viewer's pair and their role in it, or null. One helper has one parent in v1. */
export async function findPairFor(viewer: Viewer): Promise<{ pair: Pair; role: Role } | null> {
  const { pair } = await records();
  for (const role of ['parent', 'helper'] as const) {
    const field = role === 'parent' ? 'parentUserId' : 'helperUserId';
    const page = await pair.list({ filter: { [field]: viewer.userId }, limit: 2 });
    // The filter is exact-match on the server; re-check here so a filter bug can't leak.
    const mine = page.data.map(toPair).find((p) => p[field] === viewer.userId);
    if (mine) return { pair: mine, role };
  }
  return null;
}

/**
 * Loads a check the viewer may see. Anything outside the viewer's own pair is a
 * 404, never a 403, so check ids can't be probed.
 */
export async function loadCheckFor(viewer: Viewer, checkId: string) {
  const mine = await findPairFor(viewer);
  if (!mine) throw notFound();
  const { check } = await records();
  let record: EntityRecord;
  try {
    record = await check.get(checkId);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'not_found' || code === 'validation_failed') throw notFound();
    throw err;
  }
  if (record.deletedAt || record.data.pairId !== mine.pair.id) throw notFound();
  return { ...mine, record, check: toCheck(record) };
}
