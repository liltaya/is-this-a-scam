'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Check, Pair } from '@/lib/contracts';
import { AuthRequestError, authRequest, friendlyAuthError } from '../../auth-client';
import styles from '../../helper-flow.module.css';

const riskLabel = {
  red: 'Several warning signs',
  yellow: 'A few warning signs',
  green: 'No obvious warning signs',
} as const;

export default function ReviewCheck({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [check, setCheck] = useState<Check | null>(null);
  const [pair, setPair] = useState<Pair | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      authRequest<{ check: Check }>(`/api/checks/${encodeURIComponent(id)}`),
      authRequest<{ pair: Pair }>('/api/pair'),
    ])
      .then(([checkResponse, pairResponse]) => {
        setCheck(checkResponse.check);
        setPair(pairResponse.pair);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof AuthRequestError && requestError.code === 'signed_out') {
          const returnTo = `/helper/checks/${encodeURIComponent(id)}`;
          router.replace(`/helper/signin?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }
        setError(friendlyAuthError(requestError));
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function answer(value: 'scam' | 'safe') {
    if (!check || check.helperAnswer !== 'pending' || sending) return;
    setSending(true);
    setError('');
    try {
      await authRequest<{ check: Check }>(`/api/checks/${encodeURIComponent(check.id)}/answer`, {
        answer: value,
        note,
      });
      router.push(`/helper/sent?id=${encodeURIComponent(check.id)}`);
    } catch (requestError) {
      setError(friendlyAuthError(requestError));
      if (requestError instanceof AuthRequestError && requestError.code === 'already_answered') {
        const latest = await authRequest<{ check: Check }>(`/api/checks/${encodeURIComponent(check.id)}`).catch(() => null);
        if (latest) setCheck(latest.check);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro}>
          <div className={styles.brand}><span className={styles.brandMark}>✓</span> Is This a Scam?</div>
          <p className={styles.eyebrow}>Caregiver review</p>
          <h1>{pair ? `${pair.parentName} asked you to check this.` : 'Review this message.'}</h1>
          <p className={styles.introCopy}>Look at the warning signs, then send your answer. Your parent will see the first reply.</p>
        </section>
        <section className={styles.panel} aria-live="polite">
          {loading && <p className={styles.notice} role="status">Opening the secure check…</p>}
          {!loading && error && !check && <p className={styles.errorMessage} role="alert" data-testid="review-error">{error}</p>}
          {!loading && check && (
            <>
              <header className={styles.panelHeader}>
                <p className={styles.eyebrow}>{pair ? `${pair.parentName}’s message` : 'Message check'}</p>
                <h2>What do you think?</h2>
              </header>
              {check.textClearedAt ? (
                <div className={styles.notice}>This message was cleared after 30 days. You can still see its saved answer below.</div>
              ) : (
                <>
                  <div className={`risk ${check.risk}`} data-testid="risk-label">{riskLabel[check.risk]}</div>
                  {check.summary && <p>{check.summary}</p>}
                  <div className="card">
                    <strong>The message</strong>
                    <p className="message" data-testid="masked-text">{check.maskedText || 'Message text is no longer available.'}</p>
                  </div>
                  <h2>Warning signs</h2>
                  {check.flags.length ? check.flags.map((flag, index) => (
                    <div className={`flag ${flag.source}`} key={`${flag.type}-${index}`} data-testid="warning-flag">
                      <strong>{flag.type.replaceAll('_', ' ')} <span className="muted" style={{ fontWeight: 400, fontSize: 15 }}>({flag.source === 'ai' ? 'AI review' : 'word check'})</span></strong>
                      {flag.quote && <q>{flag.quote}</q>}
                      {flag.explain && <p>{flag.explain}</p>}
                    </div>
                  )) : <p className="muted">No specific warning signs were found. Your parent asked you to review it, so please give them your opinion.</p>}
                </>
              )}

              {check.helperAnswer !== 'pending' ? (
                <div className={styles.successMessage} data-testid="already-answered">
                  You already replied <strong>{check.helperAnswer === 'scam' ? 'Scam' : 'All good'}</strong>. This check can only be answered once.
                  {check.helperNote && <p style={{ margin: '8px 0 0' }}>Your note: {check.helperNote}</p>}
                </div>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <label htmlFor="note">Add a note for {pair?.parentName || 'your parent'} (optional)</label>
                    <textarea id="note" maxLength={200} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Call me before you do anything." data-testid="helper-note" />
                    <p className={styles.hint}>{200 - note.length} characters left</p>
                  </div>
                  {error && <p className={styles.errorMessage} role="alert">{error}</p>}
                  <button className="btn danger" onClick={() => answer('scam')} disabled={sending} data-testid="answer-scam">{sending ? 'Sending…' : 'Scam'}</button>
                  <button className="btn ok" onClick={() => answer('safe')} disabled={sending} data-testid="answer-safe">{sending ? 'Sending…' : 'All good'}</button>
                </>
              )}
            </>
          )}
          {!loading && error && check && <p className={styles.errorMessage} role="alert">{error}</p>}
        </section>
      </div>
    </main>
  );
}
