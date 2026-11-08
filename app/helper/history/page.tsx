'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Check, Pair } from '@/lib/contracts';
import { AuthRequestError, authRequest, friendlyAuthError } from '../auth-client';
import styles from '../helper-flow.module.css';

type CheckHistoryResponse = { checks: Check[]; nextOffset: number | null };
const PAGE_SIZE = 25;
const riskLabel = {
  red: 'Several warning signs',
  yellow: 'A few warning signs',
  green: 'No obvious warning signs',
} as const;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function HelperHistoryPage() {
  const router = useRouter();
  const [pair, setPair] = useState<Pair | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const result = await authRequest<CheckHistoryResponse>(
        `/api/checks/history?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      setChecks((current) => append ? [...current, ...result.checks] : result.checks);
      setNextOffset(result.nextOffset);
    } catch (requestError) {
      if (requestError instanceof AuthRequestError && requestError.code === 'signed_out') {
        router.replace('/helper/signin');
        return;
      }
      setError(friendlyAuthError(requestError));
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    authRequest<{ pair: Pair }>('/api/pair')
      .then(({ pair: connectedPair }) => {
        if (active) setPair(connectedPair);
        return loadPage(0, false);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof AuthRequestError && requestError.code === 'signed_out') {
          router.replace('/helper/signin');
          return;
        }
        setError(friendlyAuthError(requestError));
        setLoading(false);
      });
    return () => { active = false; };
  }, [loadPage, router]);

  const loadMore = () => {
    if (nextOffset !== null && !loadingMore) void loadPage(nextOffset, true);
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro}>
          <div className={styles.brand}><span className={styles.brandMark}>✓</span> SafeLine</div>
          <p className={styles.eyebrow}>Caregiver account</p>
          <h1>Past message checks</h1>
          <p className={styles.introCopy}>
            Review the messages {pair ? `${pair.parentName} has asked you about` : 'your parent has asked you about'} and the answers you sent.
          </p>
          <a href="/helper" className={styles.secondaryButton}>Back to helper home</a>
        </section>

        <section className={styles.panel} aria-live="polite" aria-busy={loading || loadingMore}>
          <header className={styles.panelHeader}>
            <h2>{pair ? `${pair.parentName}’s checks` : 'Check history'}</h2>
            <p>Newest first. Open a check to see its warning signs and saved reply.</p>
          </header>

          {loading && <p className={styles.notice} role="status">Loading past checks…</p>}
          {!loading && error && (
            <>
              <p className={styles.errorMessage} role="alert">{error}</p>
              <button className={styles.secondaryButton} type="button" onClick={() => void loadPage(0, false)} data-testid="history-retry">Try again</button>
            </>
          )}
          {!loading && !error && checks.length === 0 && (
            <div className={styles.notice} data-testid="history-empty">No checks yet. When your parent asks you to review a message, it will appear here.</div>
          )}

          {!loading && checks.length > 0 && (
            <div className={styles.historyList} data-testid="check-history">
              {checks.map((check) => {
                const answer = check.helperAnswer === 'scam'
                  ? 'You answered: Scam'
                  : check.helperAnswer === 'safe'
                    ? 'You answered: All good'
                    : 'Waiting for your answer';
                const message = check.textClearedAt
                  ? 'Message cleared after 30 days'
                  : check.maskedText || 'Message unavailable';
                return (
                  <article className={styles.historyItem} key={check.id} data-testid="history-item">
                    <div className={styles.historyTopline}>
                      <time dateTime={check.createdAt}>{formatDate(check.createdAt)}</time>
                      <span className={`risk ${check.risk}`}>{riskLabel[check.risk]}</span>
                    </div>
                    <p className={styles.historyMessage}>{message}</p>
                    <p className={styles.historyAnswer} data-testid="history-answer">{answer}</p>
                    <a href={`/helper/checks/${encodeURIComponent(check.id)}`} className={styles.historyLink}>
                      Open check <span aria-hidden="true">→</span>
                    </a>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && nextOffset !== null && checks.length > 0 && (
            <button className={styles.secondaryButton} type="button" onClick={loadMore} disabled={loadingMore} data-testid="history-load-more">
              {loadingMore ? 'Loading…' : 'Load more checks'}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
