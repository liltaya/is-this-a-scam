import type { Flag } from '@/lib/contracts';
import { analyze } from '@/lib/server/analyze';
import { sendCheckAlert } from '@/lib/server/email';
import { HttpError, errorResponse, readJson } from '@/lib/server/http';
import { records } from '@/lib/server/piezas';
import { requireViewer, withSession } from '@/lib/server/session';
import { TEXT_KEPT_TAG, findPairFor, flagsJson, toCheck } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT = 5000;

// The contract's rules for analyze(), enforced again here so a bad engine
// result can't break the screens or call a message safe.
function sanitize(maskedText: string, flags: Flag[], risk: string, summary: string) {
  const kept = flags.filter((f) => f.quote && maskedText.includes(f.quote)).slice(0, 4);
  const safeRisk = risk === 'red' || risk === 'yellow' ? risk : 'green';
  const cleanSummary =
    safeRisk === 'green' && /\bsafe\b/i.test(summary)
      ? 'We found no obvious warning signs, but wait for your helper before you act.'
      : summary;
  return { flags: kept, risk: safeRisk as 'red' | 'yellow' | 'green', summary: cleanSummary };
}

// POST /api/checks: parent only. Creates a check and emails the helper.
export async function POST(request: Request) {
  try {
    const viewer = await requireViewer(request);
    const body = await readJson(request);
    const text = body.text;
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new HttpError(400, 'invalid_input', 'Please paste the message first.');
    }
    if (text.length > MAX_TEXT) {
      throw new HttpError(400, 'invalid_input', 'That message is too long. Please paste a shorter part of it.');
    }

    const mine = await findPairFor(viewer);
    if (!mine) throw new HttpError(403, 'no_pair', 'Your helper has not finished setting up your account yet.');
    if (mine.role !== 'parent') throw new HttpError(403, 'not_allowed', 'Only the parent can check a message.');

    // Raw text goes only into analyze(); everything stored below is masked.
    const result = await analyze({ text });
    const clean = sanitize(result.maskedText, result.flags, result.risk, result.summary);

    const { check } = await records();
    const record = await check.create({
      title: `Check ${new Date().toISOString()}`,
      tags: [TEXT_KEPT_TAG],
      data: {
        pairId: mine.pair.id,
        parentUserId: viewer.userId,
        maskedText: result.maskedText,
        screenshotFileId: '',
        risk: clean.risk,
        flagsJson: flagsJson(clean.flags),
        summary: clean.summary,
        engine: result.engine === 'rules+ai' ? 'rules+ai' : 'rules-only',
        helperAnswer: 'pending',
        helperNote: '',
        answeredAt: '',
        textClearedAt: '',
      },
    });
    const created = toCheck(record);

    // The check is saved either way; a failed email must not lose it. Try twice,
    // then tell the screen (helperNotified: false) so it can show the call button
    // straight away, and note it on the check's timeline.
    let helperNotified = false;
    for (let attempt = 1; attempt <= 2 && !helperNotified; attempt++) {
      try {
        await sendCheckAlert(request, mine.pair, created);
        helperNotified = true;
      } catch (err) {
        console.error(`[checks] helper email failed (attempt ${attempt})`, created.id, err);
      }
    }
    if (!helperNotified) {
      await check
        .logActivity(created.id, { type: 'note', content: { text: 'Helper alert email could not be sent.' } })
        .catch((err: unknown) => console.error('[checks] could not log email failure', err));
    }

    return withSession(viewer, Response.json({ check: created, helperNotified }, { status: 201 }));
  } catch (err) {
    return errorResponse(err);
  }
}
