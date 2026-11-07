# Contributing

Everyone commits their own work from their own GitHub account. That is how the judges see four real contributors, so please don't push for each other.

## First time on your laptop

1. Install Node.js (LTS) and Git. Check with `node --version` and `git --version`.
2. Set your Git identity to match your GitHub account, so your commits (including Claude Code's) count for you:

   ```
   git config --global user.name "Your Name"
   git config --global user.email "the-email-on-your-github-account"
   ```

3. Accept the repo invite from @liltaya, then clone and install:

   ```
   git clone https://github.com/liltaya/is-this-a-scam.git
   cd is-this-a-scam
   npm install
   ```

4. Accept the Piezas invite email and sign in at [app.piezas.ai](https://app.piezas.ai). MFA is required.
5. Get the `.env` values from @liltaya privately, never through GitHub or a group chat. Copy `.env.example` to `.env` and fill it in.
6. Open the folder in Claude Code and start a new chat. When it asks whether you trust the folder, say yes. That switches on the Piezas checks for this project.
7. Run the app with `npm run dev` and open the address it prints.

## Daily flow

1. Pick your Issue, check it's assigned to you, and move it to Doing on the board.
2. Branch from main, prefixed with your letter:

   ```
   git switch main
   git pull
   git switch -c a/result-screen
   ```

3. Commit small and often. Start the message with your letter and the Issue number: `A: highlight flagged phrases on result screen (#12)`.
4. Before you open a PR, run `npx piezas test`. Don't weaken a test to make it pass; talk to the owner of that scenario instead.
5. Push and open a PR into main. Fill in the template.
6. One teammate checks it on their phone and merges.
7. After any merge, everyone runs `git pull` on main before starting the next branch.

## Folder ownership

| Folder | Owner |
| --- | --- |
| `app/page.tsx`, `app/check/` | A: Parent experience (@mga113) |
| `app/helper/`, `app/setup/` | B: Helper experience (@jhynds12) |
| `app/api/`, Piezas records, email, `.github/workflows/` | C: Piezas backend (@liltaya) |
| `lib/mask.ts`, `lib/rules.ts`, `analyze()`, test messages | D: Scam engine (@eakbarib) |
| `SPEC.md`, `docs/contracts.md` | Everyone; changes need the affected owners to approve |
| `tests/scenarios/` | Whoever owns the screen or route the scenario covers |
| `.piezas/`, `CLAUDE.md` Piezas section | Nobody edits by hand; Piezas manages them |

Need to change someone else's folder? Ask them first, or pair on it.

## Pairing credit

When two people work on one commit, add this as the last line of the commit message so both get credit:

```
Co-authored-by: Their Name <their-github-email>
```

## Secrets

- Never commit `.env`. The `.gitignore` already covers it.
- Never put `PIEZAS_API_KEY` or `ANTHROPIC_API_KEY` in browser code: no `NEXT_PUBLIC_` prefix, never read in a `'use client'` file. The Piezas checks block this.
- Production settings are set by @liltaya with `npx piezas env set NAME=value`.

## Checkpoints

| When | What must be true |
| --- | --- |
| Now | Repo cloned, `npm install` done, Claude Code trusts the folder, your Issues picked up |
| Checkpoint 2, end of Day 1 | Full loop works on two phones from the live link |
| Feature freeze, Day 2 midday | Fixes only after this |
