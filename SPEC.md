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
- R-021: Every day at 3:00 a.m. Vancouver time, checks older than 30 days have their masked text cleared, flag quotes and explanations blanked, and any screenshot deleted, with "text cleared at" set; risk, summary and helper answer are kept.

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
Given a check older than 30 days with risk red and helper answer scam
When the nightly 3:00 a.m. Vancouver clean-up runs
Then its masked text and flag quotes and explanations are blank, "text cleared at" is set, and its risk and helper answer are unchanged

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
