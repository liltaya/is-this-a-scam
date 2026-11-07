#!/usr/bin/env bash
# Creates labels and one GitHub Issue per task in docs/tasks.md, assigned to its owner.
# Run once, from the project folder: bash scripts/create-issues.sh
# Needs the GitHub CLI (gh), signed in as someone with write access to the repo.
set -euo pipefail

REPO="${REPO:-liltaya/is-this-a-scam}"

if [ "$(gh issue list --repo "$REPO" --label owner:A --state all --limit 1 --json number --jq length 2>/dev/null || echo 0)" != "0" ]; then
  echo "Issues already exist for this repo. Not creating them twice."
  exit 0
fi

label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }
label "owner:A"   "1f6feb" "Parent experience (@mga113)"
label "owner:B"   "8250df" "Helper experience (@jhynds12)"
label "owner:C"   "d97706" "Piezas backend (@liltaya)"
label "owner:D"   "16a34a" "Scam engine and pitch (@eakbarib)"
label "team"      "6b7280" "Everyone"
label "day-1"     "fbca04" "Due by end of Day 1"
label "day-2"     "c5def5" "Due on Day 2"
label "must-have" "b91c1c" "Judges watch this working"
label "stretch"   "e5e7eb" "Only after the must-haves work"

owner_of() {
  case "$1" in
    *owner:A*) echo "mga113" ;;
    *owner:B*) echo "jhynds12" ;;
    *owner:C*) echo "liltaya" ;;
    *owner:D*) echo "eakbarib" ;;
    *) echo "" ;;
  esac
}

# issue "<labels>" "<title>" "<done when>"
issue() {
  local who body
  who="$(owner_of "$1")"
  body="**Done when:** $3

Owner: ${who:+@$who}${who:-everyone}. See docs/tasks.md, SPEC.md and docs/contracts.md."
  # Assign the owner if they have accepted the repo invite; otherwise leave it unassigned.
  if [ -n "$who" ] && gh issue create --repo "$REPO" --label "$1" --title "$2" --body "$body" --assignee "$who" >/dev/null 2>&1; then
    echo "created and assigned to @$who: $2"
  else
    gh issue create --repo "$REPO" --label "$1" --title "$2" --body "$body" >/dev/null
    echo "created (unassigned): $2"
  fi
}

# A: Parent experience
issue "owner:A,day-1,must-have" "A: Wire paste screen to POST /api/checks" "Pasting a message creates a real check through C's route. (S-002)"
issue "owner:A,day-1,must-have" "A: Highlight flag quotes inside the message" "Each flag's quote is highlighted in the message on the result screen, not only listed below. (R-011)"
issue "owner:A,day-1,must-have" "A: Waiting screen polls for the answer" "Polls GET /api/checks/:id every 3 seconds; the helper's answer shows within 5 seconds. (S-003)"
issue "owner:A,day-1,must-have" "A: 10-minute fallback with call button" "After 10 minutes the parent sees the warning and a call button, hidden when there's no phone number. (S-007)"
issue "owner:A,day-1" "A: Never show safe before the helper answers" "A green result says 'No warning signs found' and keeps waiting; 'All good' only after the helper answers. (S-009)"
issue "owner:A,day-1" "A: Big-type pass at phone width" "Body text 20px or more, buttons 32px or more, checked on an iPhone and an Android."
issue "owner:A,day-2" "A: Usability test with an interviewee" "One older adult tried the app, and what confused them is fixed."
issue "owner:A,day-2,stretch" "A: Second language for parent screens" "All parent screens switch language with one toggle."

# B: Helper experience
issue "owner:B,day-1,must-have" "B: Helper sign-up with MFA" "A helper signs up and sets up MFA; there is no way to sign up as a parent. (S-001)"
issue "owner:B,day-1,must-have" "B: Add parent, helper picks the password" "The helper adds the parent and picks a strong suggested password the parent never sees. (S-001)"
issue "owner:B,day-1,must-have" "B: Parent's first sign-in on her phone" "The helper signs the parent in once on her phone; the session lasts 90 days. (S-001)"
issue "owner:B,day-1,must-have" "B: Review page from the email link" "The link opens the real check: masked message, risk and flags. (S-003)"
issue "owner:B,day-1" "B: One-tap answer, refused twice" "Scam or All good in one tap with an optional note; a second answer is refused. (S-006)"
issue "owner:B,day-1" "B: Confirmation screen" "After answering, the helper sees 'Sent. [Parent] sees your answer now.' (S-003)"
issue "owner:B,day-2" "B: Demo rehearsal and backup video" "The full loop is rehearsed on two phones and recorded."
issue "owner:B,day-2,stretch" "B: History of past checks" "The helper sees a list of past checks and answers."

# C: Piezas backend
issue "owner:C,day-1,must-have" "C: Server routes with stub analyze()" "Routes in docs/contracts.md work with a stub analyze(); PR from c/backend. (S-002, S-003, S-006)"
issue "owner:C,day-1,must-have" "C: Access rules and audit trail" "Only the pair can read a check, others get not found, and every view is in the audit trail. (S-005)"
issue "owner:C,day-1,must-have" "C: Helper alert email" "The email follows the contracts.md template and contains no message text. (S-002)"
issue "owner:C,day-1" "C: Nightly retention" "GitHub Actions clears text older than 30 days nightly; old text is also cleared when a check is opened. (S-008)"
issue "owner:C,day-1" "C: Invite team to Piezas and share .env" "All three teammates are in the Piezas app and have the .env values, shared privately."
issue "owner:C,day-1,must-have" "C: Deploy to Piezas Cloud" "The live link works on two phones (Checkpoint 2)."
issue "owner:C,day-2" "C: Merge PRs and pre-deploy checks" "Quality scan and npx piezas test run before each deploy."

# D: Scam engine and pitch
issue "owner:D,day-1,must-have" "D: analyze() with Claude Haiku 5.5 and fallback" "Masks, runs rules, sends only masked text to claude-haiku-5-5, falls back to rules-only after 8 seconds, never throws. Replaces C's stub. (S-002, S-010)"
issue "owner:D,day-1,must-have" "D: Harden mask.ts" "Card, account and verification numbers are masked, with unit tests. (S-004)"
issue "owner:D,day-1" "D: Align the flag shape with contracts.md" "lib/sample-data.ts and docs/contracts.md agree on the flag fields (explanation vs explain, free-text vs fixed types)."
issue "owner:D,day-1" "D: 30 test messages and runner" "20 scams and 10 normal messages; every scam red or yellow, no normal message red. Haiku and Sonnet compared."
issue "owner:D,day-1" "D: Extend keyword rules" "rules.ts catches what the test messages showed it missing."
issue "owner:D,day-2" "D: Pitch slides" "Slides with fraud figures, interview quotes and assumptions; 3-minute run-through timed."
issue "owner:D,day-2,stretch" "D: Read screenshots with Claude" "A screenshot gives the same result as the pasted text."

# Everyone
issue "team,day-1" "Everyone: interview one older adult or adult child" "Each teammate adds one row to docs/interviews.md, with consent to use a first name."
issue "team,day-2" "Everyone: bug bash on three or more phones" "Bugs found after the feature freeze are logged and fixed."

echo "Done."
