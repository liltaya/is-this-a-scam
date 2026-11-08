'use client';
import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { findCheck, flagLabel, pair, riskLabel, type Check } from '@/lib/sample-data';

type View = 'auto' | 'scam' | 'safe' | 'fallback';

export default function Result({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const search = useSearchParams();
  const [check, setCheck] = useState<Check | null | undefined>(undefined);

  useEffect(() => {
    if (id === 'new') {
      const saved = sessionStorage.getItem('preview-check');
      if (!saved) return setCheck(null);
      const p = JSON.parse(saved);
      setCheck({
        id: 'new', maskedText: p.maskedText, risk: p.risk, flags: p.flags,
        summary: p.flags.length ? 'We found warning signs in this message.' : 'No warning signs found, but wait for Alex before acting.',
        engine: 'rules-only', helperAnswer: 'pending', createdAt: new Date().toISOString(),
      });
    } else {
      setCheck(findCheck(id) ?? null);
    }
  }, [id]);

  if (check === undefined) return <main><p>Loading…</p></main>;
  if (check === null) return <main><h1>We couldn&apos;t find that check.</h1><a href="/" className="btn">Go home</a></main>;

  const view = (search.get('view') as View) || 'auto';
  const answer = view === 'scam' || view === 'safe' ? view : check.helperAnswer;
  const showFallback = view === 'fallback' && answer === 'pending';

  return (
    <main>
      {answer === 'scam' && (
        <>
          <div className="answer scam" data-testid="helper-answer">Scam.<br />Don&apos;t reply or pay.</div>
          <p className="muted">{pair.helperName} checked it for you.</p>
          {check.helperNote && <p className="note">&ldquo;{check.helperNote}&rdquo; — {pair.helperName}</p>}
        </>
      )}
      {answer === 'safe' && (
        <>
          <div className="answer safe" data-testid="helper-answer">All good.</div>
          <p className="muted">{pair.helperName} checked it for you.</p>
          {check.helperNote && <p className="note">&ldquo;{check.helperNote}&rdquo; — {pair.helperName}</p>}
        </>
      )}

      {answer === 'pending' && (
        <>
          <div className={`risk ${check.risk}`} data-testid="risk">{riskLabel[check.risk]}</div>
          <p>{check.summary}</p>
          {showFallback ? (
            <>
              <div className="fallback" data-testid="fallback">
                Don&apos;t pay or reply until you talk to someone you trust.
              </div>
              {pair.helperPhone && (
                <a href={`tel:${pair.helperPhone.replace(/\s/g, '')}`} className="btn" data-testid="call-helper">
                  Call {pair.helperName}
                </a>
              )}
            </>
          ) : (
            <div className="waiting" data-testid="waiting">
              <span className="dot" aria-hidden="true" />
              Waiting for {pair.helperName}…
            </div>
          )}
          <p className="muted">Don&apos;t reply, click links or pay while you wait.</p>
        </>
      )}

      <h2>The message</h2>
      <p className="message">{check.maskedText}</p>
      {check.maskedText.includes('****') && (
        <p className="masked-note" data-testid="masked-note">🔒 We hid card and account numbers before saving this message.</p>
      )}

      {check.flags.length > 0 && (
        <section aria-labelledby="flags">
          <h2 id="flags">What we noticed</h2>
          {check.flags.map((f, i) => (
            <div className="flag" key={i} data-testid="flag">
              <strong>{flagLabel[f.type]}</strong>
              <q>{f.quote}</q>
              <p>{f.explain}</p>
            </div>
          ))}
        </section>
      )}

      <a href="/" className="btn secondary">Done</a>

      <div className="preview-tools">
        Preview only, to see each state:{' '}
        <a href="?view=auto">Waiting</a>
        <a href="?view=scam">Alex says Scam</a>
        <a href="?view=safe">Alex says All good</a>
        <a href="?view=fallback">After 10 minutes</a>
        <a href="/check/c4">Card number check (**** 1111)</a>
      </div>
    </main>
  );
}
