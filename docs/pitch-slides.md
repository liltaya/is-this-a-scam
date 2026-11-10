# Is This a Scam?: pitch

Owner: D (@eakbarib). Issue #30. Target: a 3-minute run-through, timed on Day 2.

The slides are a Claude Slides deck (ask @liltaya for the link). This file is the text of each slide, so the facts can be checked in a PR. The times add up to about 3 minutes.

Items in [brackets] still need checking before the pitch.

---

## 1. Title (5 s)

Is This a Scam? Asking is faster than paying.

An older parent checks a suspicious message with their adult child in one tap, before they reply or pay.

Taya, Mrinal, John, Sam [check names]

---

## 2. The problem (15 s)

"Mom, I'm in trouble. Send me money."

An older parent gets a message like this and has one question: is this real? Most people can't answer that alone, and scammers count on it.

Speaker note: open with the question, not with the app.

---

## 3. How big is it (15 s)

- Canadians reported losing over $704 million to fraud in 2025.
- Only 5% to 10% of frauds are reported, so the real losses are much larger.
- People aged 60 and over: about 17,000 reported cases and $137.9 million lost in 2024.

Sources:
- Canadian Anti-Fraud Centre, March 6, 2026 (2025 losses, share reported): https://antifraudcentre-centreantifraude.ca/news-nouvelles/2026/2026-03-06-eng.htm
- CARP, "Frauds and Scams: CARP Demands Justice for Seniors", April 1, 2025, citing CAFC data (age 60+, 2024): https://www.carp.ca/?p=182911

Speaker note: say "reported" every time. Don't round the figures.

---

## 4. Who we spoke to (20 s)

- Alex: his mother got a phone call saying he had been in a car accident.
- Maya: her mother got a text like "Mom, I'm in trouble, send me money", and she paid.

Both scams used the child as bait. The scam uses the child. Our app asks the real one.

Details and consent: docs/interviews.md. [Confirm Alex and Maya agree to be named.]

Speaker note: these are summaries of what they told us, not quotes. The demo helper should not be called Alex, so judges don't mix the two up: use another name when you set up the demo pair.

---

## 5. How it works (25 s)

1. Parent pastes: taps the one big button and pastes the message.
2. Numbers hidden: card, account and code numbers are masked first.
3. Signs explained: keyword rules and Claude point out what looks wrong, in plain words.
4. Helper asked: an email with a sign-in link, never the message text.
5. One-tap answer: the helper taps Scam or All good, and the parent sees it in seconds.

Speaker note: the app never calls a message safe on its own. Only the helper can say "All good".

---

## 6. Example: a fake CRA message (30 s, or the live demo)

> CRA: You have an unclaimed tax refund of $1,280. Confirm your details within 24 hours at cra-refund-secure.info

What the parent sees (shortened):
- **Red:** warning signs found.
- **Rushes you:** "within 24 hours" is meant to make you act fast.
- **Pretends to be the CRA:** the CRA doesn't send refunds by text with a link.
- **Strange link:** cra-refund-secure.info is not a government website.
- Waiting for your helper's answer.

Speaker note: this is a made-up example from our test set, not a real case. If the phones are ready, do the live demo here instead and keep this slide as the backup.

---

## 7. Built for parents (15 s)

- No password to remember: the helper signs the parent in once, on the parent's own phone.
- One big button: large text, one action per screen, plain words.
- Never says "safe" by itself: green means "no warning signs found, wait for your helper".
- No answer in 10 minutes: the parent sees "Don't pay or reply until you talk to someone you trust" and a call button (if the helper gave a phone number).

---

## 8. Privacy (15 s)

- Card, account and code numbers are masked before Claude or the database sees them. Message text is never logged.
- Every request is checked on the server: only the parent and their own helper can see a check.
- Helper emails have a link that needs sign-in, never the message text.
- Message text is deleted in a nightly clean-up after 30 days. Only the verdict stays.
- Helpers use two-step sign-in (MFA).
- The Claude and Piezas keys stay on the server.

---

## 9. Does it work? (20 s)

- 30 test messages: 20 scams and 10 normal.
- Claude Haiku 5.5, the app's model: all 20 scams red, no normal message red (8 green, 2 yellow).
- Claude Sonnet 5.5, compared: all 20 scams red, no normal message red (7 green, 3 yellow).
- The keyword rules alone left 6 scams at yellow. Claude raised them to red. The AI can only raise a risk, never lower it.
- Automated scenario tests: 8 of 10 pass. S-001 needs a real email inbox for its sign-up step. S-008 runs the nightly clean-up by hand instead of waiting for 3 a.m., so the test record counts it as not written.
- Full results: docs/model-comparison.md.

Speaker note: the test messages are made up. Say so.

---

## 10. What we still need to learn (15 s)

Not known yet:
- Our test messages are made up, so we don't know how many real scams we'd miss.
- Parents may want to send a screenshot. This version needs pasted text.
- Phone calls, like the one Alex's mother got, aren't covered yet.

Next steps:
- Test on real messages from our interviews, with permission.
- Run a usability test with an older adult (Issue #8).
- Add screenshots and phone calls, with numbers still hidden.

---

## 11. Close (5 s)

The scam uses the child. Our app asks the real one.

Is This a Scam? Built in two days by four people, with Piezas, Claude and GitHub.
