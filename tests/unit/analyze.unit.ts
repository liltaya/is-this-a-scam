import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, parseAiReply } from '../../lib/ai/analyze';

const realFetch = globalThis.fetch;
const realKey = process.env.ANTHROPIC_API_KEY;
const GIFT_CARD_TEXT = "Grandma it's me. I'm in trouble and need $900 in gift cards today. Please don't tell Mom.";

// A fake Claude reply in the shape the Messages API returns.
function claudeReply(text: string) {
  return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

let requests: { body: string; headers: Record<string, string> }[] = [];

beforeEach(() => {
  requests = [];
  process.env.ANTHROPIC_API_KEY = 'test-key';
});

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = realKey;
});

function stubFetch(handler: () => Promise<Response>) {
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    requests.push({ body: String(init?.body ?? ''), headers: init?.headers as Record<string, string> });
    return handler();
  }) as typeof fetch;
}

describe('analyze() with Claude', () => {
  it('lets Claude decide the risk', async () => {
    stubFetch(async () =>
      claudeReply(JSON.stringify({ risk: 'red', summary: 'This looks like the grandchild scam.', flags: [{ type: 'secrecy', quote: "Please don't tell Mom", explain: 'Asks you to keep it secret.' }] })),
    );
    const result = await analyze({ text: GIFT_CARD_TEXT });
    assert.equal(result.engine, 'rules+ai');
    assert.equal(result.risk, 'red');
    assert.equal(result.summary, 'This looks like the grandchild scam.');
  });

  it('lets Claude clear a message the rules flagged', async () => {
    stubFetch(async () => claudeReply(JSON.stringify({ risk: 'green', summary: 'Looks like a normal bank notice.', flags: [] })));
    const result = await analyze({ text: 'Your Interac e-Transfer from Alex for $40.00 was deposited.' });
    assert.equal(result.engine, 'rules+ai');
    assert.equal(result.risk, 'green');
  });

  it('keeps the rule flags next to Claude flags, and never more than 4', async () => {
    stubFetch(async () =>
      claudeReply(JSON.stringify({
        risk: 'red',
        summary: 'A scam.',
        flags: [
          { type: 'impersonation', quote: "Grandma it's me", explain: 'Pretends to be a grandchild.' },
          { type: 'urgency', quote: 'today', explain: 'Duplicate of a rule flag, so dropped.' },
        ],
      })),
    );
    const result = await analyze({ text: GIFT_CARD_TEXT });
    assert.ok(result.flags.length <= 4);
    assert.equal(result.flags.filter((f) => f.quote === 'today').length, 1);
    assert.ok(result.flags.some((f) => f.source === 'ai' && f.quote === "Grandma it's me"));
  });

  it('sends only masked text to Claude', async () => {
    stubFetch(async () => claudeReply(JSON.stringify({ risk: 'red', summary: 'A scam.', flags: [] })));
    await analyze({ text: 'Your card 4111 1111 1111 1111 was charged. Cancel immediately at amzn-refund-help.info' });
    assert.equal(requests.length, 1);
    assert.ok(!requests[0].body.includes('4111 1111 1111 1111'));
    assert.ok(requests[0].body.includes('**** 1111'));
    assert.equal(requests[0].headers['x-api-key'], 'test-key');
  });

  it('never calls a green message safe in the summary', async () => {
    stubFetch(async () => claudeReply(JSON.stringify({ risk: 'green', summary: 'This message is safe.', flags: [] })));
    const result = await analyze({ text: 'Dinner at six. Love, Sam' });
    assert.equal(result.risk, 'green');
    assert.ok(!/\bsafe\b/i.test(result.summary));
  });
});

describe('analyze() falls back to rules', () => {
  it('uses rules only when there is no API key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    stubFetch(async () => claudeReply('{}'));
    const result = await analyze({ text: GIFT_CARD_TEXT });
    assert.equal(result.engine, 'rules-only');
    assert.equal(result.risk, 'red');
    assert.equal(requests.length, 0);
  });

  it('uses rules only when Claude cannot be reached', async () => {
    stubFetch(async () => {
      throw new Error('network down');
    });
    const result = await analyze({ text: GIFT_CARD_TEXT });
    assert.equal(result.engine, 'rules-only');
    assert.equal(result.risk, 'red');
  });

  it('uses rules only when Claude returns an error', async () => {
    stubFetch(async () => new Response('overloaded', { status: 529 }));
    const result = await analyze({ text: GIFT_CARD_TEXT });
    assert.equal(result.engine, 'rules-only');
  });

  it('uses rules only when Claude replies with something that is not a verdict', async () => {
    stubFetch(async () => claudeReply('I am not sure about this one.'));
    const result = await analyze({ text: GIFT_CARD_TEXT });
    assert.equal(result.engine, 'rules-only');
    assert.equal(result.risk, 'red');
  });

  it('gives up after 8 seconds and uses rules only', { timeout: 15_000 }, async () => {
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      // Stands in for a Claude call that never finishes. It only ends when analyze() aborts it.
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    }) as typeof fetch;

    const started = Date.now();
    const result = await analyze({ text: GIFT_CARD_TEXT });
    const elapsed = Date.now() - started;
    assert.equal(result.engine, 'rules-only');
    assert.ok(elapsed >= 7_500 && elapsed < 10_000, `took ${elapsed}ms`);
  });
});

describe('parseAiReply', () => {
  const masked = 'Call Mom at 604-555-0199 today.';

  it('reads a verdict even when Claude adds text around the JSON', () => {
    const parsed = parseAiReply('Here you go: {"risk":"yellow","summary":"Be careful.","flags":[]} Thanks.', masked);
    assert.deepEqual(parsed, { risk: 'yellow', summary: 'Be careful.', flags: [] });
  });

  it('drops a flag whose quote is not in the masked text', () => {
    const parsed = parseAiReply(
      JSON.stringify({ risk: 'red', summary: 'x', flags: [{ type: 'urgency', quote: 'tomorrow', explain: 'Not in the text.' }] }),
      masked,
    );
    assert.deepEqual(parsed?.flags, []);
  });

  it('turns an unknown flag type into other', () => {
    const parsed = parseAiReply(
      JSON.stringify({ risk: 'red', summary: 'x', flags: [{ type: 'vibes', quote: 'today', explain: 'Odd.' }] }),
      masked,
    );
    assert.equal(parsed?.flags[0].type, 'other');
    assert.equal(parsed?.flags[0].source, 'ai');
  });

  it('returns null without a risk it understands', () => {
    assert.equal(parseAiReply(JSON.stringify({ risk: 'purple', summary: 'x', flags: [] }), masked), null);
    assert.equal(parseAiReply('no json here', masked), null);
  });
});
