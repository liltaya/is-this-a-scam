'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Check, Pair } from '@/lib/contracts';
import { AuthRequestError, authRequest, friendlyAuthError } from '../auth-client';
import styles from '../helper-flow.module.css';

function SentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [check, setCheck] = useState<Check | null>(null);
  const [pair, setPair] = useState<Pair | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError('We couldn’t find that check. Open the secure link from your email again.');
      setLoading(false);
      return;
    }

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
          router.replace('/helper/signin');
          return;
        }
        setError(friendlyAuthError(requestError));
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const answered = check?.helperAnswer === 'scam' || check?.helperAnswer === 'safe';
  const answerLabel = check?.helperAnswer === 'scam' ? 'Scam' : 'All good';

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro}>
          <div className={styles.brand}><span className={styles.brandMark}>✓</span> SafeLine</div>
          <p className={styles.eyebrow}>Caregiver reply</p>
          <h1>{answered ? `Sent. ${pair?.parentName || 'Your parent'} sees your answer now.` : 'Your reply hasn’t been confirmed yet.'}</h1>
          <p className={styles.introCopy}>Your response is saved with the message check so your parent can see what you advised.</p>
        </section>
        <section className={styles.panel} aria-live="polite">
          {loading && <p className={styles.notice} role="status">Checking your reply…</p>}
          {!loading && error && <p className={styles.errorMessage} role="alert">{error}</p>}
          {!loading && check && (
            <>
              {answered ? (
                <>
                  <div className={styles.successMark} aria-hidden="true">✓</div>
                  <header className={styles.panelHeader}>
                    <h2 data-testid="sent">Sent. {pair?.parentName || 'Your parent'} sees your answer now.</h2>
                    <p>You answered <strong>{answerLabel}</strong>.</p>
                  </header>
                  {check.helperNote && <div className={styles.notice}><strong>Your note</strong><br />{check.helperNote}</div>}
                </>
              ) : (
                <>
                  <header className={styles.panelHeader}>
                    <h2>We don’t see a saved reply</h2>
                    <p>This link doesn’t confirm that an answer was sent. Go back to the check and submit your choice.</p>
                  </header>
                  <a href={`/helper/checks/${encodeURIComponent(check.id)}`} className={styles.primaryButton}>Return to the check</a>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function SentPage() {
  return <Suspense><SentContent /></Suspense>;
}
