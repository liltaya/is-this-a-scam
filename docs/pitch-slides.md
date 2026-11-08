# Is This a Scam?: pitch

Owner: D (@eakbarib). Issue #30. Target: a 3-minute run-through, timed on Day 2.

Items in [brackets] are not filled in yet. Each one needs a real source before the pitch.

---

## 1. The problem

An older person gets a text that says their parent's card is blocked, or that a grandchild needs bail money.

They have one question: is this real? Most people can't answer that alone, and scammers count on it.

Speaker note: open with the question, not with the app.

---

## 2. How big is it

- [Total reported fraud losses in Canada, 2024: $ figure from the CAFC 2024 Annual Statistical Report]
- [Total fraud reports, 2024: figure from the same report]
- [Most-reported fraud type and its share: from the same report]

Source: Canadian Anti-Fraud Centre, CAFC 2024 Annual Statistical Report (open.canada.ca).

Speaker note: quote the source, not a rounded guess. Don't add a figure that isn't in the report.

---

## 3. Who we spoke to

- [First name, age range, relation to parent, and one quote, with consent]
- [First name, age range, relation, quote]
- [First name, age range, relation, quote]

Speaker note: quotes come from interviews only. Use first names and only with permission (see docs/interviews.md).

---

## 4. What the app does

1. The parent pastes a suspicious message into one screen.
2. The app masks card and account numbers, then runs keyword rules and asks Claude for plain-language warning signs.
3. The helper (their adult child) gets an email with a link. The email never contains the message text.
4. The helper answers "Scam" or "All good" in one tap.
5. The parent sees the answer on their screen.

Speaker note: the app never calls a message safe on its own. Only the helper can say "All good".

---

## 5. Example: a fake CRA message

> "CRA: You have an unclaimed tax refund of $1,280. Confirm your details within 24 hours at cra-refund-secure.info"

The app shows:
- **Red.** Several warning signs found.
- **Urgency:** "within 24 hours" is meant to make you act fast.
- **Impersonation:** the CRA doesn't send refunds by text with a link.
- **Link:** cra-refund-secure.info is not a government website.

Speaker note: this is a made-up example from our test set, not a real case.

---

## 6. How well it works

- 30 test messages: 20 scams and 10 normal.
- Haiku 5.5, the app's model: all 20 scams red, no normal message red, 10 of 10 normal green.
- Sonnet 5.5, compared: all 20 scams red, no normal message red, 3 of 10 normal yellow.
- Full results: docs/model-comparison.md.

Speaker note: the test messages are made up. Say so.

---

## 7. What we assume, and what we don't know yet

- Open question: what if the helper doesn't answer? After 10 minutes the parent sees "Don't pay or reply until you talk to someone you trust", with a call button if a phone number is set.
- Assumption: parents will paste a message rather than screenshot it. Screenshots are not in this version.
- Not yet known: [how many real messages the test set misses, from real people's messages]

Speaker note: be clear about what's tested and what's not.

---

## 8. What's next

- Test on real messages from the interviews, with permission.
- Usability test with one older adult.
- Screenshot reading, after the card-number privacy problem is solved.

---

## 9. Close

One question: is this real?

The app gives the parent a plain-language answer, and the helper gives the final one.
