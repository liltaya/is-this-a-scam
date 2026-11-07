# Contracts

Everyone builds against these shapes from hour one. A and B can use fake data that matches them; D's engine returns exactly `AnalyzeResult`; C's routes return exactly `Check`. Changing anything here is its own PR, approved by the owners it affects.

Owner: C (Piezas backend). Last changed: Day 1 kickoff.

## Shared types

```ts
type Role = "parent" | "helper";
type Risk = "red" | "yellow" | "green";
type HelperAnswer = "pending" | "scam" | "safe";
type FlagType =
  | "urgency" | "money" | "gift_cards" | "codes"
  | "secrecy" | "impersonation" | "link" | "other";

interface Flag {
  type: FlagType;
  quote: string;    // exact phrase from the masked text, used for highlighting
  explain: string;  // one short sentence in plain words
  source: "rules" | "ai";
}
```

## Piezas record types

### pair

One parent, one helper.

```ts
interface Pair {
  id: string;
  parentUserId: string;     // Piezas user, role "parent"
  helperUserId: string;     // Piezas user, role "helper"
  parentName: string;       // shown to the helper, e.g. "Mom" or "Galina"
  helperName: string;       // shown to the parent, e.g. "Alex"
  helperPhone: string | null; // for the parent's "Call Alex" button
  createdAt: string;        // ISO 8601
}
```

### check

```ts
interface Check {
  id: string;
  pairId: string;
  parentUserId: string;
  maskedText: string | null;        // null once cleared after 30 days
  screenshotFileId: string | null;  // stretch; deleted after analysis
  risk: Risk;
  flags: Flag[];
  summary: string;                  // one sentence a 75-year-old understands; "" once cleared after 30 days
  engine: "rules+ai" | "rules-only";
  helperAnswer: HelperAnswer;       // starts "pending"
  helperNote: string | null;        // optional, max 200 characters; null once cleared after 30 days
  createdAt: string;
  answeredAt: string | null;
  textClearedAt: string | null;
}
```

## Who can see and do what

| Action | Parent (own pair) | Helper (own pair) | Anyone else |
| --- | --- | --- | --- |
| Create a check | Yes | No | No |
| Read a check | Yes | Yes | No (404) |
| Answer a check | No | Yes, once | No (404) |
| Read the pair | Yes | Yes | No (404) |

Return 404, not 403, for checks outside your pair, so check ids can't be probed.

## Scam engine interface (D to C)

```ts
// lib/ai/analyze.ts (owned by D)
export async function analyze(input: { text: string }): Promise<AnalyzeResult>;

interface AnalyzeResult {
  maskedText: string;   // card, account and code numbers replaced, e.g. "**** 4417"
  risk: Risk;
  flags: Flag[];        // 0 to 4, each quote found in maskedText
  summary: string;
  engine: "rules+ai" | "rules-only";
}
```

Rules for `analyze`:

- Masks first. Raw text never leaves this function, and nothing it returns contains unmasked numbers.
- Never throws. If Claude fails or takes longer than 8 seconds, it returns the keyword-rules result with `engine: "rules-only"`.
- Never returns `risk: "green"` with the word "safe" anywhere in `summary`.

## Server routes (C)

All routes require a signed-in Piezas user. Errors always look like `{ "error": { "code": "not_found", "message": "Plain words for the screen" } }`.

### `POST /api/checks`

Parent only. Creates a check and emails the helper.

Request:

```json
{ "text": "Grandma it's me, I need $900 in gift cards, don't tell Mom" }
```

Rules: `text` required, 1 to 5,000 characters.

Response `201`:

```json
{ "check": { "id": "chk_123", "risk": "red", "helperAnswer": "pending", "...": "full Check" }, "helperNotified": true }
```

`helperNotified` is `false` when the helper email could not be sent (after one retry). The screen should then skip the wait and show the "talk to someone you trust" fallback with the call button right away.

### `GET /api/checks/:id`

Parent or helper of the pair. The parent's waiting screen polls this every 3 seconds until `helperAnswer` is not `"pending"`, or 10 minutes have passed since `createdAt` (then it shows the no-answer fallback).

Response `200`: `{ "check": Check }`

### `POST /api/checks/:id/answer`

Helper of the pair only.

Request:

```json
{ "answer": "scam", "note": "Call me before you do anything" }
```

Rules: `answer` is `"scam"` or `"safe"`; `note` optional, max 200 characters. A second answer returns `409`.

Response `200`: `{ "check": Check }`

### `GET /api/pair`

Parent or helper. Returns names and the helper's phone for the call button.

Response `200`: `{ "pair": Pair }`

### Signed-in requests

The routes read the Piezas session token from `Authorization: Bearer <token>` or the `its_session` cookie. When Piezas extends a session, the response sets a fresh `its_session` cookie. A missing or expired session gets `401` with code `signed_out`. Other codes: `invalid_input` (400), `no_pair` / `not_allowed` (403, create only), `not_found` (404), `already_answered` (409), `server_error` (500).

### Setup and sign-in routes

Accounts, passwords, sessions and sign-in codes all live in the Piezas users service. The page never sees a session token or a sign-in challenge: both travel in HttpOnly cookies (`its_session` for 90 days, `its_mfa` for 10 minutes). Passwords are at least 12 characters.

After every successful sign-in step, and from `GET /api/auth/me`, the screen gets an `AuthStatus` and decides where to go:

```ts
interface AuthStatus {
  status: "signed_in";
  role: "parent" | "helper" | null;
  mfaEnabled: boolean;
  needsMfaSetup: boolean; // helper hasn't turned on sign-in codes yet: send them to that step
  pair: Pair | null;      // null: a helper still has to add their parent
}
```

| Screen | Route | Request | Success |
| --- | --- | --- | --- |
| Helper sign-up | `POST /api/auth/signup` | `{ name, email, password }` | `201 { status: "verify_email" }`, and Piezas emails a confirmation link to `/helper/verify?token=...` |
| Helper verify page | `POST /api/auth/verify-email` | `{ token }` from the link | `AuthStatus` (signed in), or `{ status: "verified" }` when the helper still has to sign in |
| Any sign-in, including the parent's first one on her phone | `POST /api/auth/signin` | `{ email, password }` | `AuthStatus`, or `{ status: "mfa_required", factors: ["email"] }` when a code is needed |
| Sign-in code step | `POST /api/auth/mfa/verify` | `{ code }` (6 digits from the email) | `AuthStatus` |
| Helper turns on sign-in codes | `POST /api/auth/mfa/setup` | none | `AuthStatus` with `mfaEnabled: true` |
| Add your parent | `POST /api/setup/parent` | `{ parentName, parentEmail, parentPassword, helperName?, helperPhone? }` | `201` `AuthStatus` with the new `pair` |
| Where am I? | `GET /api/auth/me` | none | `AuthStatus` plus `name` |
| Sign out | `POST /api/auth/signout` | none | `{ status: "signed_out" }`, cookies cleared |

The flow, matching S-001:

1. The helper signs up, confirms their email from the link, and signs in.
2. `needsMfaSetup: true`, so the helper turns on sign-in codes. Every later sign-in emails a 6-digit code. A helper can't add a parent before this step (R-002).
3. The helper adds their parent. The screen suggests a strong generated password (16+ random characters, made in the browser) that the helper can save in their password manager. The parent never sees it.
4. On the parent's phone, the helper opens `/setup` and signs in with the parent's email and that password once. The parent stays signed in for 90 days.

Only helpers can sign up (R-001); a parent account exists only through "Add your parent". One helper has one parent in this version.

Error codes: `invalid_input` (400), `invalid_code` (400), `invalid_link` (400), `email_not_verified` (403), `invalid_credentials` (401), `expired` (401, start the sign-in again), `signed_out` (401), `not_allowed` (403), `mfa_required` (403, turn on sign-in codes first), `email_taken` (409), `already_paired` (409), `rate_limited` (429), `server_error` (500).

## Helper alert email (Piezas template `check_alert`)

No message text in the email: it stays behind sign-in.

Subject: `{{parentName}} would like your opinion on a message`

Body:

```
Hi {{helperName}},

{{parentName}} just received a message and wants to check it with you before doing anything.

Our first look: {{riskLabel}}

Open it here and answer in one tap:
{{reviewLink}}

Thank you for looking out for them.
Is This a Scam?
```

`riskLabel` is one of: "Several warning signs", "A few warning signs", "No obvious warning signs".

## Retention job (C)

Piezas has no timed jobs yet, so a scheduled GitHub workflow (`.github/workflows/retention.yml`) calls `POST /api/jobs/retention` (with `Authorization: Bearer $RETENTION_SECRET`; anything else gets 404) every day at 3:00 a.m. Vancouver time. As a backup, `GET /api/checks/:id` clears an overdue check before returning it, so old text never shows even if a night is missed. On every check older than 30 days the job clears `maskedText` (to `null`), blanks each flag's `quote` and `explain`, clears `summary` (to `""`) and `helperNote` (to `null`), deletes the screenshot and sets `textClearedAt`. Only `risk`, the flag types, `helperAnswer` and the timestamps (`createdAt`, `answeredAt`, `textClearedAt`) stay, for the anonymous counts. The summary and note go too because they can repeat personal details from the message. Screens should show a plain "This message was cleared after 30 days" when `textClearedAt` is set.
