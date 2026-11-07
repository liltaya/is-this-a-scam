# Tasks

Who does what. Each line is also a GitHub Issue assigned to its owner. Scenario numbers (S-xxx) point to [SPEC.md](../SPEC.md); each has a test in `tests/scenarios/`.

The screens already exist on sample data from the approved preview. The work now is wiring them to C's real routes, polishing them, and making the scenario tests pass.

## A: Parent experience (@mga113)

Folders: `app/page.tsx`, `app/check/`

- [ ] **Must-have:** Wire the paste screen to `POST /api/checks` once C's PR is merged. (S-002)
- [ ] **Must-have:** Highlight each flag's quote inside the message on the result screen, not only in the list below it. (R-011)
- [ ] **Must-have:** Waiting screen polls `GET /api/checks/:id` every 3 seconds, so the answer shows within 5 seconds. (S-003)
- [ ] **Must-have:** 10-minute fallback with the call button; the button is hidden when there's no phone number. (S-007)
- [ ] Never show "All good" or "safe" before the helper answers, even for a green result. (S-009)
- [ ] Big-type pass at phone width: body text 20px or more, buttons 32px or more. Check on an iPhone and an Android.
- [ ] Day 2: usability test with one interviewee, and fix whatever confused them.
- [ ] Stretch: second language for the parent screens.

## B: Helper experience (@jhynds12)

Folders: `app/helper/`, `app/setup/`

- [ ] **Must-have:** Helper sign-up with MFA; there is no way to sign up as a parent. (S-001)
- [ ] **Must-have:** Add your parent: the helper picks the parent's password (suggest a strong generated one), and the parent never sees it. (S-001)
- [ ] **Must-have:** The parent's first sign-in on her phone, lasting 90 days. (S-001)
- [ ] **Must-have:** Review page opened from the email link, wired to the real check. (S-003)
- [ ] One-tap "Scam" or "All good" with an optional note; a second answer is refused. (S-006)
- [ ] Confirmation screen: "Sent. [Parent] sees your answer now." (S-003)
- [ ] Day 2: rehearse the live demo on two phones and record the backup video.
- [ ] Stretch: history of past checks.

## C: Piezas backend (@liltaya)

Folders: `app/api/`, Piezas records, email, `.github/workflows/`

- [ ] **Must-have:** Server routes from docs/contracts.md, with a stub `analyze()` until D's lands. PR from branch `c/backend`. (S-002, S-003, S-006)
- [ ] **Must-have:** Only the pair can read a check, anyone else gets "not found", and every view is in the audit trail. (S-005)
- [ ] **Must-have:** Helper email from the contracts.md template, with no message text in it. (S-002)
- [ ] Nightly retention through GitHub Actions, plus clearing old text when a check is opened. Set the cleanup secret in Piezas and GitHub. (S-008)
- [ ] Invite the team to the Piezas app and share `.env` values privately.
- [ ] **Must-have:** Deploy to Piezas Cloud; live link works on two phones (Checkpoint 2).
- [ ] Day 2: merge PRs; run the quality scan and `npx piezas test` before each deploy.

## D: Scam engine and pitch (@eakbarib)

Folders: `lib/mask.ts`, `lib/rules.ts`, `analyze()`, test messages

- [ ] **Must-have:** `analyze()`: mask, run rules, send only masked text to Claude Haiku 5.5 (`claude-haiku-5-5`), and fall back to `rules-only` after 8 seconds. Replaces C's stub. (S-002, S-010)
- [ ] **Must-have:** Harden `lib/mask.ts` for card, account and verification numbers, with unit tests. (S-004)
- [ ] Align the flag shape: `lib/sample-data.ts` uses `explanation` and free-text types, while docs/contracts.md says `explain` and fixed types. Agree with C which one wins and update the other.
- [ ] 30 test messages (20 scams, 10 normal) and a script that runs them. Target: every scam red or yellow, no normal message red. Compare Haiku and Sonnet.
- [ ] Extend `lib/rules.ts` with whatever the test messages show it misses.
- [ ] Day 2: pitch slides with fraud figures, interview quotes and assumptions.
- [ ] Stretch: read screenshots with Claude.

## Everyone

- [ ] Interview one older adult or adult child, and add a row to [interviews.md](interviews.md), with consent to use their first name.
- [ ] Day 2: bug bash on three or more phones after the feature freeze.
