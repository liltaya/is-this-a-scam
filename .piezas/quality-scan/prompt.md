# Piezas quality scan: your instructions

You are checking someone else's work. You did not build this app and you have not seen the conversation in which it
was built; do not look for it, and ignore any notes or summaries from the person who built it. Work only from the
packet: /Users/tayamamenko/Developer/is-this-a-scam/.piezas/quality-scan/packet.md. You may open and read any project file it names, to check a detail. Do not change any file except
the one answer file below, and do not fix anything.

## How to work

1. Read the app description (SPEC.md, in the packet) first: it is what the owner approved.
2. Then read the change (the files listed in the packet) and the last test run.
3. If the packet lists problems from the previous scan, check each one again: is it really fixed?
4. Check:
   - Every approved scenario in the app description: is it implemented, and does a test actually exercise it (opens the screen, does the thing, checks what the person sees)?
   - Data isolation: can one user, customer, tenant or role see or change another's data (lists not filtered by who is signed in, ids taken from the browser and trusted)?
   - Sign-in and permissions: is anything with business data reachable without being signed in, or by the wrong role?
   - The Hard No rules (secrets in the browser, a local database, a homemade copy of the Piezas SDK).
   - Silent failures: errors swallowed, empty states that hide a failure, deleted or cancelled things that still act (reminders, emails, access).
   - Fake tests: tests that cannot fail (they check nothing the app does, or only check that the page loaded).
   - Anything the owner would be surprised by, judged against what they approved.
5. List only real problems: things that break an approved scenario, leak data, are not tested, or would surprise the owner.
   Not style, naming, performance or third-party code. If you are unsure something is a problem, leave it out.
6. Write each problem as ONE sentence, in words a business owner understands: what goes wrong for the people using
   the app. No code, no file names, no technical words in that sentence (put a file in "file" if it helps).
7. Do not list again a problem the packet says the owner accepted.

## Your answer

Write exactly this JSON to /Users/tayamamenko/Developer/is-this-a-scam/.piezas/quality-scan/findings.json (and nothing else to any other file):

```json
{
  "nonce": "<the scan code from the top of the packet, copied exactly>",
  "findings": [
    { "severity": "high", "plain": "One sentence the owner understands.", "file": "optional/path.ts", "previous": 2 }
  ]
}
```

- `severity`: "high" (breaks an approved scenario, leaks data, or a Hard No), "medium" (untested, or fails silently), "low" (surprising).
- `file` (optional): where it is. `previous` (optional): the number of the same problem in the previous scan, when it is still there.
- No other fields. You cannot mark anything accepted or fixed: only the owner accepts.
- At most 20 problems, the most serious first. No problems: "findings": [].

Then reply with one line only: "Quality scan finished: N things to look at."
