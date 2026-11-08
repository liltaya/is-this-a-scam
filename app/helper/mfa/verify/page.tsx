'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthStatus } from '@/lib/contracts';
import { authRequest, friendlyAuthError, helperSignedInPath, safeHelperReturnTo } from '../../auth-client';
import styles from '../../helper-flow.module.css';

export default function VerifySignInCodePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const status = await authRequest<AuthStatus>('/api/auth/mfa/verify', { code });
      const returnTo = safeHelperReturnTo(new URLSearchParams(window.location.search).get('returnTo'));
      router.replace(helperSignedInPath(status, returnTo));
    } catch (requestError) {
      setError(friendlyAuthError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro}>
          <div className={styles.brand}><span className={styles.brandMark}>✓</span> Is This a Scam?</div>
          <p className={styles.eyebrow}>Caregiver sign in · Step 2</p>
          <h1>One more step to protect your account.</h1>
          <p className={styles.introCopy}>We sent a one-time code to your email. Enter it here to finish signing in.</p>
        </section>
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>Enter your sign-in code</h2>
            <p>The code expires after a short time. If it has expired, sign in again to get a new one.</p>
          </header>
          <form onSubmit={verifyCode}>
            <div className={styles.inputGroup}>
              <label htmlFor="mfa-code">6-digit code</label>
              <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} required data-testid="mfa-code" />
            </div>
            {error && <p className={styles.errorMessage} role="alert">{error}</p>}
            <button className={styles.primaryButton} type="submit" disabled={loading || code.length < 6} data-testid="mfa-verify">{loading ? 'Checking code…' : 'Verify and continue'}</button>
          </form>
          <a href="/helper/signin" className={styles.secondaryButton}>Back to sign in</a>
        </section>
      </div>
    </main>
  );
}
