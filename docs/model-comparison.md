# Model comparison: Haiku 5.5 vs Sonnet 5.5

Run on 2026-11-07 with `npm run check:messages` (Haiku, the default) and `npm run check:messages -- --model claude-sonnet-5-5`. Both runs used the Claude API, so every message shows `rules+ai`. The 30 messages are in `scripts/test-messages.ts`.

Target (from issue #28): every scam red or yellow, and no normal message red.

| Model | Scams red or yellow | Normal messages red | Normal messages green | Result |
| --- | --- | --- | --- | --- |
| claude-haiku-5-5 (default) | 20 of 20 (all red) | 0 of 10 | 10 of 10 | 30 of 30 passed |
| claude-sonnet-5-5 | 20 of 20 (all red) | 0 of 10 | 7 of 10 (3 yellow) | 30 of 30 passed |

The three Sonnet yellows are normal-05 (RBC statement notice), normal-08 (Interac e-Transfer deposit) and normal-10 (Canada Post delivery). Yellow is allowed by the target, but it is a false alarm for a message that is harmless.

**Decision:** keep Haiku 5.5 as the default in `ANALYZE_MODEL`. It passes the target, and it gave no false alarms on the normal messages. Sonnet also passes, but gave three false alarms. We did not measure speed or cost in this run.

**Known issue for follow-up:** Claude sometimes returns the same flag type twice for one message, with different quotes (for example, `urgency, money, money, impersonation` for scam-10). The app keeps each one, which is accurate, but the result screen may look repetitive. It does not change the risk.
