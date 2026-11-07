import { HttpError, errorResponse, notFound, readJson } from '@/lib/server/http';
import { records } from '@/lib/server/piezas';
import { requireViewer, withSession } from '@/lib/server/session';
import { loadCheckFor, toCheck } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_NOTE = 200;
const inFlight = new Set<string>();
const alreadyAnswered = () => new HttpError(409, 'already_answered', 'You already answered this one.');

// POST /api/checks/:id/answer: helper of the pair only, once.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer(request);
    const { id } = await params;
    const body = await readJson(request);

    const answer = body.answer;
    if (answer !== 'scam' && answer !== 'safe') {
      throw new HttpError(400, 'invalid_input', 'Please choose "Scam" or "All good".');
    }
    const rawNote = body.note;
    if (rawNote !== undefined && rawNote !== null && typeof rawNote !== 'string') {
      throw new HttpError(400, 'invalid_input', 'The note was not readable.');
    }
    const note = typeof rawNote === 'string' ? rawNote.trim() : '';
    if (note.length > MAX_NOTE) {
      throw new HttpError(400, 'invalid_input', `Please keep the note under ${MAX_NOTE} characters.`);
    }

    // One answer at a time per check, so two quick taps can't both be accepted.
    if (inFlight.has(id)) throw alreadyAnswered();
    inFlight.add(id);
    try {
      const { record, role, check: current } = await loadCheckFor(viewer, id);
      // The parent of the pair can read but not answer; to them it looks like any other refusal.
      if (role !== 'helper') throw notFound();
      if (current.helperAnswer !== 'pending') throw alreadyAnswered();

      const { check } = await records();
      const answeredAt = new Date().toISOString();
      await check.update(record.id, {
        data: { ...record.data, helperAnswer: answer, helperNote: note, answeredAt },
      });
      // Read back: if another server wrote a different answer at the same moment, the stored one wins.
      const stored = toCheck(await check.get(record.id));
      if (stored.answeredAt !== answeredAt) throw alreadyAnswered();
      return withSession(viewer, Response.json({ check: stored }));
    } finally {
      inFlight.delete(id);
    }
  } catch (err) {
    return errorResponse(err);
  }
}
