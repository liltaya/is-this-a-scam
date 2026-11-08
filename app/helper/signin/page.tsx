'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AuthStatus } from '@/lib/contracts';
import { authRequest, friendlyAuthError, helperSignedInPath, isMfaRequired, safeHelperReturnTo, type SignInStatus } from '../auth-client';
import styles from '../helper-flow.module.css';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const verified = searchParams.get('verified') === '1';
  const returnTo = safeHelperReturnTo(searchParams.get('returnTo'));

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authRequest<SignInStatus>('/api/auth/signin', { email, password });
      if (isMfaRequired(result)) {
        const next = returnTo ? `/helper/mfa/verify?returnTo=${encodeURIComponent(returnTo)}` : '/helper/mfa/verify';
        router.push(next);
        return;
      }
      const status: AuthStatus = result;
      router.push(helperSignedInPath(status, returnTo));
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
          <p className={styles.eyebrow}>For family caregivers</p>
          <h1>Be there when a message feels off.</h1>
          <p className={styles.introCopy}>Sign in to help your parent check suspicious texts and see their past checks.</p>
        </section>
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>Caregiver sign in</h2>
            <p>Use the email and password you signed up with.</p>
          </header>
          {verified && <p className={styles.successMessage} role="status">Your email is confirmed. You can sign in now.</p>}
          <form onSubmit={signIn}>
            <div className={styles.inputGroup}>
              <label htmlFor="signin-email">Email address</label>
              <input id="signin-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required data-testid="signin-email" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="signin-password">Password</label>
              <input id="signin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required data-testid="signin-password" />
            </div>
            {error && <p className={styles.errorMessage} role="alert">{error}</p>}
            <button className={styles.primaryButton} type="submit" disabled={loading} data-testid="signin-submit">{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className={styles.previewNote}>After you sign in, we’ll guide you to any step you still need to finish.</p>
          <a href="/helper/signup" className={styles.secondaryButton}>Create a helper account</a>
        </section>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return <Suspense><SignInContent /></Suspense>;
}
