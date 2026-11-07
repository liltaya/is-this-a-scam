# Is This a Scam?

One big button lets an older person check a suspicious message before they reply or pay. Their adult child answers "Scam" or "All good" in one tap, and the answer shows up on the parent's screen within seconds.

Asking is faster than paying.

Built in two days by a team of four on [Piezas](https://piezas.ai), with Claude Code and the Claude API.

## How it works

1. The parent pastes a message and taps "Is this a scam?"
2. Our server masks card, account and verification numbers, runs keyword rules, and asks Claude for plain-language red flags.
3. The check is saved in Piezas, and the paired helper gets an email with a review link.
4. The helper taps "Scam" or "All good". The parent's screen shows the answer.

The app never calls a message safe on its own. Only the helper can say "All good".

## Team

| Role | GitHub | Owns |
| --- | --- | --- |
| A: Parent experience | [@mga113](https://github.com/mga113) | `app/page.tsx`, `app/check/` |
| B: Helper experience | [@jhynds12](https://github.com/jhynds12) | `app/helper/`, `app/setup/` |
| C: Piezas backend | [@liltaya](https://github.com/liltaya) | `app/api/`, Piezas records, email, retention, deploy |
| D: Scam engine | [@eakbarib](https://github.com/eakbarib) | `lib/mask.ts`, `lib/rules.ts`, `analyze()`, test messages |

## Start here

1. [SPEC.md](SPEC.md): what the app must do. Requirements R-001 to R-021, and scenarios S-001 to S-010. Each scenario has a Playwright test in `tests/scenarios/`.
2. [docs/contracts.md](docs/contracts.md): record shapes, server routes and the scam engine interface. Build against these.
3. [CONTRIBUTING.md](CONTRIBUTING.md): set up your laptop, Git identity, branches and PRs.
4. [docs/team-rules.md](docs/team-rules.md): rules every Claude Code session on this repo follows.
5. [docs/tasks.md](docs/tasks.md): who does what. Each task is also an [Issue](../../issues) assigned to its owner.
6. [docs/interviews.md](docs/interviews.md): the people we spoke to.

## How we treat data

- Card, account and verification numbers are masked on our server before anything else runs. Claude only ever sees masked text.
- Only the parent and their paired helper can open a check. Every view is in the Piezas audit trail.
- Message text is cleared after 30 days by a nightly job, and at once if an older check is opened. Only the verdict stays.
- Helper alert emails never contain the message itself, just a link that needs sign-in.
