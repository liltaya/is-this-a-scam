import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maskNumbers } from '../../lib/mask';
import { runRules } from '../../lib/rules';
import { TEST_MESSAGES } from '../../scripts/test-messages';

const check = (text: string) => runRules(maskNumbers(text));

// A real report from testing: this came back green, because no keyword matched
// and the amount (written without a $) was hidden as ****.
describe('the "family member in trouble" scam, without gift cards or "today"', () => {
  it('is red when the child is in trouble and asks for money', () => {
    const r = check('Mom, I am in trouble, give me 1000 on this phone number 778 555 3456');
    assert.equal(r.risk, 'red');
    assert.deepEqual(r.flags.map((f) => f.type).sort(), ['impersonation', 'money']);
  });

  it('is red for the "new number" version', () => {
    assert.equal(check('Hi Mom, I lost my phone, this is my new number. Can you send me money for a taxi?').risk, 'red');
  });

  it('is red for the accident version', () => {
    assert.equal(check("Dad, I was in a car accident. I'm OK but I need money for the tow truck.").risk, 'red');
  });

  it('is at least yellow when a family member asks for money with no story', () => {
    assert.notEqual(check('Grandma can you send me $300?').risk, 'green');
  });
});

describe('a new phone number', () => {
  it('is flagged when the message is written to a parent or grandparent', () => {
    assert.notEqual(check('Hi Mom, this is my new number, save it').risk, 'green');
    assert.notEqual(check('This is my new number, Grandma. Text me here.').risk, 'green');
    // One warning sign, not two: a lost phone and a new number are the same story.
    assert.equal(check('Hi Mom, I lost my phone, this is my new number.').risk, 'yellow');
  });

  it('is ordinary news from a clinic, a pharmacy or a friend', () => {
    assert.equal(check('Lakeside Clinic has moved. Our new phone number is 604 555 0188.').risk, 'green');
    assert.equal(check('Hi Jean, it is Carol from church. This is my new number.').risk, 'green');
    const r = check('Your pharmacy has a new phone number. Call us today to confirm your refill.');
    assert.notEqual(r.risk, 'red');
    assert.ok(!r.flags.some((f) => f.type === 'impersonation'));
  });
});

describe('normal messages', () => {
  it('none of the 10 normal test messages is red from the keyword rules', () => {
    for (const m of TEST_MESSAGES.filter((t) => t.kind === 'normal')) {
      assert.notEqual(check(m.text).risk, 'red', m.id);
    }
  });

  it('ordinary family messages are not flagged', () => {
    assert.equal(check('Mom, can you pick me up after practice? Love you').risk, 'green');
    assert.equal(check('Happy birthday, Dad! Call me when you can.').risk, 'green');
  });
});
