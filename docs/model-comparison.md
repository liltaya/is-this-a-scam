# Model comparison: Haiku 5.5 vs Sonnet 5.5

Run on 2026-11-07 with `npm run check:messages` (Haiku, the default) and `npm run check:messages -- --model claude-sonnet-5-5`, after the fix that stops Claude from lowering the keyword rules' risk. Every message shows `rules+ai`, so Claude answered in both runs. The 30 messages are in `scripts/test-messages.ts`.

Target (from issue #28): every scam red or yellow, and no normal message red.

| Model | Scams red or yellow | Normal messages red | Normal messages green | Normal messages yellow | Result |
| --- | --- | --- | --- | --- | --- |
| claude-haiku-5-5 (default) | 20 of 20 (all red) | 0 of 10 | 8 of 10 | 2 of 10 | 30 of 30 passed |
| claude-sonnet-5-5 | 20 of 20 (all red) | 0 of 10 | 7 of 10 | 3 of 10 | 30 of 30 passed |

The yellows are false alarms on harmless messages. Haiku: normal-04 (dinner invitation, the keyword rules flag "today") and normal-08 (Interac e-Transfer deposit, the rules flag "$40.00"). Sonnet: those two plus normal-10 (Canada Post delivery, a link to canadapost.ca). Yellow is allowed by the target, but these are the cases to watch.

**Decision:** keep Haiku 5.5 as the default in `ANALYZE_MODEL`. Both pass the target. Haiku gave fewer false alarms in this run.

**Known issue for follow-up:** Claude sometimes returns the same flag type twice for one message, with different quotes (for example, `urgency, money, money, impersonation` for scam-10). The app keeps each one, which is accurate, but the result screen may look repetitive. It does not change the risk.

**Note on the earlier run:** the first version of this file (before the fix that stops Claude from lowering the rules' risk) showed Haiku with no yellow normal messages. That came from Claude overriding the rules. These numbers replace it.
