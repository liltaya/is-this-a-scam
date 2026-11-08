# Piezas quality scan packet

Scan code: qs-d2b9c1500027380a2e
Round: 2 of 3
Project folder: /Users/tayamamenko/Developer/is-this-a-scam

## The app description (what the owner approved)

# Product Spec — Is This a Scam?

Source: the group's app description, pasted by Taya on 2026-11-06 ("What the app
does"). Every claim below comes from it or from Taya's answers on 2026-11-06.

## Overview

Is This a Scam? lets an older person check a suspicious text, email or link with
one big button before they reply or pay. The server masks card, account and
verification numbers, runs keyword rules and asks the Claude API for
plain-language red flags. The person's adult child (their helper) gets an email,
opens the check and answers "Scam" or "All good" in one tap, and the parent's
screen shows the answer within seconds. The app never calls a message safe on
its own; only the helper can.

## Not in this version

Native apps, SMS, payments, bank connections, reading the parent's messages
automatically, more than one helper per parent, bulk email, screenshots on a
check (the field exists for later), and the credit union staff role that only
sees anonymous counts.

## Users and roles

- Parent: an older adult with low tech comfort. Uses four screens only and never
  types a password.
- Helper: their adult child. Signs up with email and uses MFA. One helper has one
  parent in this version.

## Requirements

- R-001: Only helpers can sign up publicly; there is no public sign-up for parents.
- R-002: A helper signs up with email and password and must set up a second sign-in step (MFA) before using the app.
- R-003: A helper adds their parent with the parent's name and email (and optionally the helper's phone number for a call button), which creates the parent's account and the pair.
- R-004: The helper finishes the parent's first sign-in on the parent's phone, so the parent never types a password: the helper chooses the parent's password when adding them and types it once on the parent's phone, and the parent is never shown it. (Piezas has no passwordless sign-in; option chosen by Taya on 2026-11-06)
- R-005: The parent's sign-in lasts 90 days on their phone.
- R-006: The parent's Home screen has one big "Is this a scam?" button that leads to a screen where they paste the message.
- R-007: Before a message is saved or sent anywhere, card, account and verification numbers in it are masked, keeping only the last four digits (4111 1111 1111 1111 becomes **** 1111); the full number appears nowhere.
- R-008: Each check gets a risk of red, yellow or green, a list of flags (type, quote, explanation, source), and a one-sentence summary, from keyword rules plus the Claude API.
- R-009: The Claude API is called only from the app's server, with the ANTHROPIC_API_KEY setting, and only ever receives masked text.
- R-010: If the Claude API cannot be reached, the check is still made from the keyword rules alone and is marked rules-only. (confirmed by Taya on 2026-11-06)
- R-011: The result screen shows the risk, the flags in plain language and the summary, then "Waiting for <helper name>".
- R-012: The app never labels a message safe on its own; a check shows "All good" only after the helper answers safe.
- R-013: When a check is created, the helper gets one email with only the parent's name, a plain risk label and a link that needs sign-in; it never contains the message text. The wording follows the template in the group's contracts.md.
- R-014: A helper opens a check from the email link, sees the masked message, risk and flags, and answers "Scam" or "All good" in one tap, with an optional note of up to 200 characters.
- R-015: After answering, the helper sees "Sent. <parent name> sees your answer now."
- R-016: The parent's screen shows the helper's answer within 5 seconds of it being given: "Scam. Don't reply or pay." or "All good."
- R-017: A helper can answer each check only once.
- R-018: If there is no answer after 10 minutes, the parent sees "Don't pay or reply until you talk to someone you trust" with a button to call the helper. Without a helper phone number the button is hidden and the message stays. (confirmed by Taya on 2026-11-06)
- R-019: A parent can create checks and read only their own checks and pair; a helper can read and answer checks only for their own parent; anyone else gets "not found".
- R-020: Every view of a check is recorded in the audit trail with who viewed it and when.
- R-021: Every day at 3:00 a.m. Vancouver time, checks older than 30 days have their masked text, flag quotes and explanations, summary and helper note cleared, and any screenshot deleted, with "text cleared at" set; only the risk, flag types, helper answer and timestamps are kept. (stricter rule from docs/contracts.md, chosen by Taya on 2026-11-07)

## Data

- Pair: parent (user), helper (user), parent name, helper name, helper phone (optional), created at
- Check: pair, parent (user), masked text (long text, cleared after 30 days), screenshot (file, optional, later), risk (red, yellow or green), flags (list of type, quote, explanation, source), summary (one sentence), engine (rules+ai or rules-only), helper answer (pending, scam or safe; starts pending), helper note (optional, up to 200 characters), created at, answered at, text cleared at

## Screens

- Parent: Home (one big "Is this a scam?" button), Paste the message, Result with flags then "Waiting for <helper name>", Answer ("Scam. Don't reply or pay." or "All good."), and the 10-minute fallback with the call button.
- Helper: Sign up, Add your parent, Review a check (opened from the email link), Confirmation.

## Sample data for the preview

Parent Galina, helper Alex (her son).

- "Grandma it's me. I'm in trouble and need $900 in gift cards today. Please don't tell Mom." risk red, helper answer pending
- "CRA: You have an unclaimed tax refund of $1,280. Confirm your details within 24 hours at cra-refund-secure.info" risk red, helper answer scam
- "Kingsway Pharmacy: your prescription is ready for pickup. Questions? Call us at the store." risk green, helper answer safe
- "Amazon Security: A $649.99 purchase was charged to your card **** 1111. If this was not you, cancel immediately at amzn-refund-help.info" risk red, helper answer pending (the original had a full card number; it is stored and shown only as **** 1111, added by Taya on 2026-11-06 to show the masking in the demo)

## Acceptance Scenarios

### S-001: A helper signs up and signs the parent in without the parent typing a password

covers: R-001, R-002, R-003, R-004, R-005
Given a new helper on the public sign-up page
When they sign up with email, set up MFA, add their parent Galina with name and email, and finish Galina's first sign-in on her phone
Then Galina's phone shows her Home screen, she never typed a password, and her sign-in is set to last 90 days, while the sign-up page offers no way to sign up as a parent

### S-002: The parent checks the gift card message

covers: R-006, R-008, R-009, R-011, R-013
needs: Claude API (ANTHROPIC_API_KEY)
Given Galina signed in on her Home screen
When she taps "Is this a scam?" and pastes the gift card message
Then the result shows risk red with at least two flags and "Waiting for Alex", and Alex gets one email with Galina's name, a risk label and a sign-in link that does not contain the message text

### S-003: The helper's answer reaches the parent within 5 seconds

covers: R-014, R-015, R-016
Given a pending check from Galina with her result screen open
When Alex opens it from the email link and taps "Scam"
Then Alex sees "Sent. Galina sees your answer now." and Galina's screen shows "Scam. Don't reply or pay." within 5 seconds

### S-004: Card numbers are masked

covers: R-007, R-009
Given Galina on the paste screen
When she submits a message containing 4111 1111 1111 1111
Then the saved check and every screen show **** 1111, and the full number appears nowhere, including what is sent to the Claude API

### S-005: Another helper cannot open the check

covers: R-019, R-020
Given a check from Galina and a different helper with their own parent
When that helper opens the check's link
Then they see "not found", and Alex's earlier view of the check appears in the audit trail

### S-006: A check can only be answered once

covers: R-017
Given a check that Alex already answered "Scam"
When Alex tries to answer it again
Then the answer is refused and the check still says "Scam"

### S-007: No answer after 10 minutes

covers: R-018
Given a check that has been pending for 10 minutes
When Galina looks at her result screen
Then she sees "Don't pay or reply until you talk to someone you trust" and a button to call Alex

### S-008: Old checks are cleared at night

covers: R-021
Given a check older than 30 days with risk red, a flag of type gift cards, helper answer scam and a helper note
When the nightly 3:00 a.m. Vancouver clean-up runs
Then its masked text, flag quotes and explanations, summary and helper note are blank, "text cleared at" is set, and its risk, flag types, helper answer and timestamps are unchanged

### S-009: A normal message is never called safe by the app

covers: R-012
Given Galina submits the pharmacy pickup message
When the result appears and Alex has not answered
Then the screen says "Waiting for Alex" and never "All good" or "safe", even though the risk is green

### S-010: The check still works without the Claude API

covers: R-010
Given the Claude API cannot be reached
When Galina submits the gift card message
Then she still gets a red result from the keyword rules, and the check is marked rules-only

## Piezas service mapping

- Sign-in for helpers and parents: Piezas users service (email and password, MFA for helpers, 90-day session setting).
- Pair and Check records: Piezas Entity Records.
- Helper email: Piezas transactional email.
- Nightly clean-up: Piezas has no timed jobs, so a scheduled GitHub workflow calls the app's protected clean-up route daily at 3:00 a.m. America/Vancouver; reads also clear overdue checks as a backup (chosen by Taya on 2026-11-07).
- Audit trail of views: Piezas audit events.
- Claude API call and number masking: the app's own server code (server mode on Piezas hosting).

## Gaps / Questions for Piezas

- Piezas has no magic link or passwordless sign-in, so the helper chooses the parent's password (R-004, chosen by Taya).
- The longest session Piezas accepts is not documented; the app will ask for 90 days.

## Open Conflicts

none

## Piezas rules

- Hard No: no secret key (PIEZAS_API_KEY or any provider secret) in browser code or behind NEXT_PUBLIC_/VITE_/PUBLIC_; no local database for business records (no SQLite, Prisma, Postgres client, JSON files as a database); no homemade copy of the Piezas SDK.
- Data isolation: every list, record read and change is limited to what the signed-in person may see. One user, customer, tenant or role must never see or change another's data.
- Sign-in: every page and server route with business data needs a signed-in person (and the right role); nothing private is reachable signed out.
- Provider tokens never live in the app: it stores connection and grant ids only.

### Core Rules

- **You advise; the owner decides.** Explain risks simply, recommend;
  never refuse the owner's choice or leave them at a dead end. Only the
  owner's own reply ("deploy anyway", "allow outside changes"; for the
  quality scan, "accept N", "go live without the scan" or "quality scan
  off") overrides a Piezas pause, never yours.
- **Plain words for the owner.** Brief and actionable: what happened, then
  the choice with the exact reply. No jargon, no long lists. (`testing`)
- **The AI fixes first; the owner is asked once**, for what only they can
  answer: one pause, remembered per item. (`testing`)
- **Ownership boundary.** The app owns UI, routes, session glue and workflow.
  Piezas owns records, pipelines, tasks, calendars, notifications, documents,
  integrations and end-user accounts. (`entities`)
- **Secrets stay server-side.** `PIEZAS_API_KEY` never behind
  `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_`; `.env` in `.gitignore`; other settings
  in `deploy.requiredEnv`/`optionalEnv`. (`deploy`)
- **No provider tokens in the app.** Store connection and grant IDs only.
  Integrations never sign people in: Google/Microsoft sign-in is
  `@piezas/sdk/sso`. (`users`)
- **Credentials live in the users service**, never in records. (`users`)
- **Per-member isolation is YOUR job.** Derive `owner_id` from the verified
  session; filter every read by it. (`users`)
- **Spec first, mock first.** `SPEC.md` with an `S-xxx` scenario per
  requirement; then UI plus seed data, before any backend wiring. (`testing`)
- **Tested before shared.** Every `S-xxx` is a Playwright test
  (`tests/scenarios/S-xxx-<name>.spec.ts`, by `data-testid`). Run `piezas
  test`, fix, re-run (3 rounds) without asking; never weaken a check without
  the owner's OK. (`testing`)
- **Fetch the slice before using a service** (and before deploying):
  `piezas_contract` with its `topic`.
- **Rule 11 — If Piezas doesn't offer it, say so.** Check
  `piezas_capabilities` (.piezas/rules/capabilities.json) before promising.
  If it's missing, say so with the workable options, recommend one, then
  follow the owner's choice. Don't change Piezas's code (backend, SDK, CLI,
  MCP) or invent endpoints unless the owner explicitly asks, knowing the risk.
- **Change only the app's folder.** Use the published `@piezas/sdk`; no
  homemade copy, and no Piezas address outside this contract. Once they know
  the risk, only the owner may type "allow outside changes".

### Hard No List

Never do these on your own. If the owner asks, explain the risk and recommend
the Piezas way; a deploy that breaks one pauses until the owner fixes it or
says "deploy anyway".

- No local database tables for Piezas-backed business objects.
- No OAuth token storage, token refresh jobs, or integration OAuth callbacks in the app.
- No scraping or undocumented provider API calls when a Piezas connector exists.
- No exposing `PIEZAS_API_KEY` to browser code.
- No public MCP route without app auth, tenant checks, and server runtime.
- No hand-written OAuth/OIDC sign-in (use `@piezas/sdk/sso`).

## The last test run

No test run is recorded yet (`piezas test` has not run).

## Problems from the previous scan: check each one again

1. [high] The parent's screens and the helper's review screen still use made-up sample data and never talk to the real app, so a message Galina pastes is not saved, Alex gets no email, Alex's tap on Scam or All good is not recorded, and his answer never reaches Galina's phone. (app/check/page.tsx)
2. [high] Helpers still cannot really sign up, set up the second sign-in step, add their parent or sign the parent in for 90 days, because those steps only move between example screens and no account is ever created. (app/helper/signup/page.tsx)
3. [high] The Claude AI is still never asked about any message, so every check gets only the simple keyword rules and is always marked rules-only, even when the AI is working. (lib/server/analyze.ts)
4. [high] Galina's result screen still has example links such as "Alex says All good" that show her an "All good" answer Alex never gave, plus a preview banner on the screen. (app/check/[id]/page.tsx)
5. [medium] None of the ten approved scenarios has a real test yet, so nothing proves the app does what was approved. (tests/scenarios)

## The change

Changed since the last scan (2026-11-07T21:13:49.796Z): 4 file(s) added or changed, 0 removed.

### changed: app/api/checks/route.ts

````
import type { Flag } from '@/lib/contracts';
import { analyze } from '@/lib/server/analyze';
import { sendCheckAlert } from '@/lib/server/email';
import { HttpError, errorResponse, readJson, safeErr } from '@/lib/server/http';
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
        console.error(`[checks] helper email failed (attempt ${attempt})`, created.id, safeErr(err));
      }
    }
    if (!helperNotified) {
      await check
        .logActivity(created.id, { type: 'note', content: { text: 'Helper alert email could not be sent.' } })
        .catch((err: unknown) => console.error('[checks] could not log email failure', created.id, safeErr(err)));
    }

    return withSession(viewer, Response.json({ check: created, helperNotified }, { status: 201 }));
  } catch (err) {
    return errorResponse(err);
  }
}
````

### changed: lib/server/audit.ts

````
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
````

### changed: lib/server/http.ts

````
import 'server-only';
import type { ApiError } from '@/lib/contracts';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const notFound = () =>
  new HttpError(404, 'not_found', "We couldn't find that check.");

/**
 * What may be logged about an error: its kind and code only. Error messages
 * from services can echo the request (and so message text), so they are never logged.
 */
export function safeErr(err: unknown): { name: string; code?: string; service?: string; operation?: string } {
  const e = err as { name?: unknown; code?: unknown; service?: unknown; operation?: unknown } | null;
  const s = (v: unknown) => (typeof v === 'string' ? v : undefined);
  return { name: s(e?.name) ?? typeof err, code: s(e?.code), service: s(e?.service), operation: s(e?.operation) };
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    const body: ApiError = { error: { code: err.code, message: err.message } };
    return Response.json(body, { status: err.status });
  }
  console.error('[api] unexpected error', safeErr(err));
  const body: ApiError = {
    error: { code: 'server_error', message: 'Something went wrong on our side. Please try again.' },
  };
  return Response.json(body, { status: 500 });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {}
  throw new HttpError(400, 'invalid_input', 'That request was not readable. Please try again.');
}
````

### changed: lib/server/retention.ts

````
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
export async function runRetention(now = new Date()): Promise<{ cleared: number; failed: number }> {
  const { check } = await records();
  let cleared = 0;
  let failed = 0;
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
````
