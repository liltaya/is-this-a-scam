'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthStatus } from '@/lib/contracts';
import { authRequest, friendlyAuthError, helperSignedInPath, safeHelperReturnTo, type AuthStatusWithName } from '../../auth-client';
import styles from '../../helper-flow.module.css';

export default function SetupSignInCodesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authRequest<AuthStatusWithName>('/api/auth/me')
      .then((status) => {
        if (status.role !== 'helper') {
          router.replace(status.role === 'parent' ? '/' : '/helper/signin');
        } else if (!status.needsMfaSetup) {
          router.replace(status.pair ? '/helper' : '/helper/add-parent');
        } else {
          setLoading(false);
        }
      })
      .catch(() => router.replace('/helper/signin'));
  }, [router]);

  async function enableCodes() {
    setSubmitting(true);
    setError('');
    try {
      const status = await authRequest<AuthStatus>('/api/auth/mfa/setup', {});
      const returnTo = safeHelperReturnTo(new URLSearchParams(window.location.search).get('returnTo'));
      router.replace(helperSignedInPath(status, returnTo));
    } catch (requestError) {
      setError(friendlyAuthError(requestError));
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro}>
          <div className={styles.brand}><span className={styles.brandMark}>✓</span> SafeLine</div>
          <p className={styles.eyebrow}>Caregiver setup · Step 2 of 3</p>
          <h1>Keep your family’s messages private.</h1>
          <p className={styles.introCopy}>Turn on a one-time sign-in code. We’ll email you a code each time you sign in.</p>
        </section>
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>Turn on sign-in codes</h2>
            <p>You need this extra step before adding your parent. Codes are handled securely by the sign-in service.</p>
          </header>
          {error && <p className={styles.errorMessage} role="alert">{error}</p>}
          <button className={styles.primaryButton} type="button" onClick={enableCodes} disabled={loading || submitting} data-testid="mfa-setup">
            {loading ? 'Checking your account…' : submitting ? 'Securing your account…' : 'Turn on email codes'}
          </button>
          <p className={styles.previewNote}>Your sign-in codes are never shown or saved by this page.</p>
        </section>
      </div>
    </main>
  );
}
