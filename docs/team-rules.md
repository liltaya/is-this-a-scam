# Team rules for Claude Code

Every Claude Code session on this repo follows these rules, together with the Piezas rules above them in `CLAUDE.md`. If the two ever disagree, the Piezas rules win.

## Product rules

- Two users: a parent (older adult, low tech comfort) and one helper (their adult child).
- The app never tells the parent a message is safe on its own. Only the helper's answer can say "All good". A green result means "no warning signs found, wait for your helper".
- Parent screens: body text 20px or more, buttons 32px or more, high contrast, one action per screen, plain words. Never make the parent feel foolish for asking.
- Helper screens: answer in one tap, nothing to install.

## Data rules

- Mask card, account and verification numbers before anything else touches a message: before Claude, before saving, before logging.
- Never log message text. Log check ids only.
- Only the parent and their paired helper can read a check. Every server route checks this on the server, never in the browser.
- Message text is cleared 30 days after a check. The verdict stays.
- Helper emails never contain the message text, only a link that needs sign-in.
- Keys stay on the server: no `NEXT_PUBLIC_` prefix, never read in a `'use client'` file.

## Code rules

- `SPEC.md` says what to build; `docs/contracts.md` says how the parts connect. Changing either is its own PR, approved by the owners it affects.
- Stay in your own folders (see `CONTRIBUTING.md`). Ask before editing someone else's.
- For anything that touches shared files, write a plan first, then code.
- Every scenario in `SPEC.md` has a test in `tests/scenarios/`. Run `npx piezas test` before a PR, and never weaken a test without the owner's OK.
- One branch per Issue, small commits, PR into main.
- Commit messages start with the owner letter and Issue number: `C: add answer route (#7)`.
