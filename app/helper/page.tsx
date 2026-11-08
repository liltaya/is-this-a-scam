'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthStatus } from '@/lib/contracts';
import { authRequest, friendlyAuthError } from './auth-client';
import styles from './helper-flow.module.css';

type HelperHomeStatus = AuthStatus & { name?: string };

export default function HelperHomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<HelperHomeStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    authRequest<HelperHomeStatus>('/api/auth/me')
      .then((result) => {
        if (result.role !== 'helper') {
          router.replace(result.role === 'parent' ? '/' : '/helper/signin');
        } else if (result.needsMfaSetup) {
          router.replace('/helper/mfa/setup');
        } else if (!result.pair) {
          router.replace('/helper/add-parent');
        } else {
          setStatus(result);
        }
      })
      .catch((requestError: unknown) => {
        setError(friendlyAuthError(requestError));
      });
  }, [router]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro}>
          <div className={styles.brand}><span className={styles.brandMark}>✓</span> Is This a Scam?</div>
          <p className={styles.eyebrow}>Caregiver account</p>
          <h1>You’re ready to help.</h1>
          <p className={styles.introCopy}>When {status?.pair?.parentName || 'your parent'} asks for help, we’ll email you a secure link to review the message and reply.</p>
        </section>
        <section className={styles.panel} aria-live="polite">
          <div className={styles.successMark} aria-hidden="true">✓</div>
          <header className={styles.panelHeader}>
            <h2>{status?.pair ? `Connected to ${status.pair.parentName}` : 'Checking your account…'}</h2>
            <p>Open the secure link in each alert email to review a message and send your answer.</p>
          </header>
          {status?.pair && <a href="/helper/history" className={styles.primaryButton} data-testid="open-history">See past checks</a>}
          {error && <p className={styles.errorMessage} role="alert">{error}</p>}
          {error && <a href="/helper/signin" className={styles.primaryButton}>Go to sign in</a>}
        </section>
      </div>
    </main>
  );
}
