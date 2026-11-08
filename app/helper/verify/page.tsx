'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AuthStatus } from '@/lib/contracts';
import { authRequest, friendlyAuthError, nextSignedInPath } from '../auth-client';
import styles from '../helper-flow.module.css';

type VerificationResult = AuthStatus | { status: 'verified' };

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const started = useRef(false);
  const [message, setMessage] = useState('Confirming your email…');
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setError('This link is missing a part. Open the confirmation email again, or sign in to request a new link.');
      return;
    }

    authRequest<VerificationResult>('/api/auth/verify-email', { token })
      .then((result) => {
        if (result.status === 'verified') {
          router.replace('/helper/signin?verified=1');
          return;
        }
        setMessage('Your email is confirmed. Taking you to the next setup step…');
        router.replace(nextSignedInPath(result));
      })
      .catch((requestError: unknown) => setError(friendlyAuthError(requestError)));
  }, [router, token]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro}>
          <div className={styles.brand}><span className={styles.brandMark}>✓</span> Is This a Scam?</div>
          <p className={styles.eyebrow}>Caregiver setup · Step 1 of 3</p>
          <h1>Confirm it’s really you.</h1>
          <p className={styles.introCopy}>Confirming your email helps keep your parent’s messages private and makes sure alerts reach you.</p>
        </section>
        <section className={styles.panel} aria-live="polite">
          <header className={styles.panelHeader}>
            <h2>{error ? 'We couldn’t confirm that link' : 'Confirming your email'}</h2>
            <p>{error ? 'Open the confirmation link from your email again, or sign in to request a new one.' : message}</p>
          </header>
          {error ? (
            <>
              <p className={styles.errorMessage} role="alert">{error}</p>
              <a href="/helper/signin" className={styles.primaryButton}>Go to sign in</a>
            </>
          ) : (
            <p className={styles.notice} role="status">Please keep this page open for a moment.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailContent /></Suspense>;
}
