import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maskNumbers } from '../../lib/mask';

// S-004 and R-007: the full card number appears nowhere, only its last four digits.
describe('card numbers', () => {
  it('keeps the last four digits of a spaced card number', () => {
    assert.equal(maskNumbers('card 4111 1111 1111 1111'), 'card **** 1111');
  });

  it('keeps the last four digits of a dashed or unspaced card number', () => {
    assert.equal(maskNumbers('4111-1111-1111-1111'), '**** 1111');
    assert.equal(maskNumbers('card 4111111111111111 today'), 'card **** 1111 today');
  });

  it('masks a card number written right after a dollar sign', () => {
    assert.equal(maskNumbers('$4111 1111 1111 1111'), '$**** 1111');
  });

  it('masks nine-digit ID numbers the same way', () => {
    assert.equal(maskNumbers('SIN 123 456 789'), 'SIN **** 6789');
  });
});

describe('account and verification numbers', () => {
  it('masks an 8-digit account number', () => {
    assert.equal(maskNumbers('account 12345678'), 'account ****');
  });

  it('masks an account number that starts with letters', () => {
    assert.equal(maskNumbers('ACC12345678'), 'ACC****');
  });

  it('masks a 3-digit CVV after the word CVV', () => {
    assert.equal(maskNumbers('CVV 123'), 'CVV ****');
  });

  it('masks a verification code, with or without a dash', () => {
    assert.equal(maskNumbers('verification code 123-456'), 'verification code ****');
    assert.equal(maskNumbers('Your code is 4417'), 'Your code is ****');
  });
});

describe('what is left alone', () => {
  it('keeps dollar amounts', () => {
    assert.equal(maskNumbers('$900 in gift cards'), '$900 in gift cards');
    assert.equal(maskNumbers('$1,280 refund'), '$1,280 refund');
    assert.equal(maskNumbers('$649.99 charged'), '$649.99 charged');
  });

  it('keeps 4-digit years and dates', () => {
    assert.equal(maskNumbers('Nov 7, 2024'), 'Nov 7, 2024');
    assert.equal(maskNumbers('2024-11-07'), '2024-11-07');
    assert.equal(maskNumbers('since 2019'), 'since 2019');
  });

  it('does not mask a number that is already masked', () => {
    const once = maskNumbers('charged to your card 4111 1111 1111 1111');
    assert.equal(once, 'charged to your card **** 1111');
    assert.equal(maskNumbers(once), once);
  });
});
