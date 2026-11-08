'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Check, Pair } from '@/lib/contracts';

type ApiError = { error?: { message?: string; code?: string } };
const riskLabel = {
  red: 'Several warning signs',
  yellow: 'A few warning signs',
  green: 'No obvious warning signs',
} as const;

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json() as T | ApiError;
  if (!response.ok) {
    const error = (data as ApiError).error;
    throw new Error(error?.message || 'We couldn’t load this check. Please try again.');
  }
  return data as T;
}

export default function Result({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const search = useSearchParams();
  const alertFailed = search.get('alert') === 'failed';
  const [check, setCheck] = useState<Check | null>(null);
  const [pair, setPair] = useState<Pair | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let initialLoaded = false;
    const checkUrl = `/api/checks/${encodeURIComponent(id)}`;
    const refreshCheck = async () => {
      try {
        const response = await fetch(checkUrl, { credentials: 'same-origin', cache: 'no-store' });
        const result = await readJson<{ check: Check }>(response);
        if (active) setCheck(result.check);
      } catch (loadError) {
        if (active && !initialLoaded) setError(loadError instanceof Error ? loadError.message : 'We couldn’t load this check.');
      }
    };

    Promise.all([
      fetch(checkUrl, { credentials: 'same-origin', cache: 'no-store' }).then((response) => readJson<{ check: Check }>(response)),
      fetch('/api/pair', { credentials: 'same-origin', cache: 'no-store' }).then((response) => readJson<{ pair: Pair }>(response)),
    ])
      .then(([checkResult, pairResult]) => {
        if (!active) return;
        initialLoaded = true;
        setCheck(checkResult.check);
        setPair(pairResult.pair);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'We couldn’t load this check.');
        setLoading(false);
      });

    const poll = window.setInterval(() => { void refreshCheck(); }, 3000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [id]);

  if (loading) return <main><p role="status">Loading your check…</p></main>;
  if (error || !check || !pair) {
    return <main><h1>We couldn&apos;t load this check.</h1><p className="muted" role="alert">{error || 'Please sign in and open your check again.'}</p><a href="/setup" className="btn">Sign in</a></main>;
  }

  const answer = check.helperAnswer;
  const ageMs = Math.max(0, now - Date.parse(check.createdAt));
  const showFallback = answer === 'pending' && (alertFailed || ageMs >= 10 * 60 * 1000);

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
      {check.textClearedAt ? (
        <p className="message" data-testid="text-cleared">This message was cleared after 30 days.</p>
      ) : (
        <p className="message" data-testid="checked-message">{check.maskedText}</p>
      )}
      {!check.textClearedAt && check.maskedText?.includes('****') && (
        <p className="masked-note" data-testid="masked-note">🔒 We hid card and account numbers before saving this message.</p>
      )}

      {check.flags.length > 0 && (
        <section aria-labelledby="flags">
          <h2 id="flags">What we noticed</h2>
          {check.flags.map((flag, index) => (
            <div className={`flag ${flag.source}`} key={`${flag.type}-${index}`} data-testid="flag">
              <strong>{flag.type.replaceAll('_', ' ')}</strong>
              {flag.quote && <q>{flag.quote}</q>}
              {flag.explain && <p>{flag.explain}</p>}
            </div>
          ))}
        </section>
      )}

      <a href="/" className="btn secondary">Done</a>
    </main>
  );
}
