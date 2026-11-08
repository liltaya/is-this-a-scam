'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AuthStatus } from '@/lib/contracts';
import { authRequest, friendlyAuthError, isMfaRequired, type SignInStatus } from '../helper/auth-client';
import styles from '../helper/helper-flow.module.css';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function ParentFirstSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Real name when the helper's setup link passes it; otherwise a neutral wording.
  const parentName = searchParams.get('name')?.trim().slice(0, 60) || 'your parent';
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authRequest<SignInStatus>('/api/auth/signin', { email, password });
      if (isMfaRequired(result)) {
        router.push('/helper/mfa/verify');
        return;
      }
      const status: AuthStatus = result;
      if (status.role !== 'parent') {
        setError('Please use the parent email set up by the caregiver.');
        return;
      }
      setDone(true);
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
          <p className={styles.eyebrow}>A caregiver is helping you set up</p>
          <h1>A little help is always close by.</h1>
          <p className={styles.introCopy}>Once you’re signed in, you can share a text that feels suspicious and ask your caregiver what to do.</p>
          <ul className={styles.benefits}>
            <li className={styles.benefit}><span className={styles.check}>✓</span><span>Your caregiver enters your sign-in details for you</span></li>
            <li className={styles.benefit}><span className={styles.check}>✓</span><span>You stay signed in for 90 days</span></li>
            <li className={styles.benefit}><span className={styles.check}>✓</span><span>You can ask for help before replying to a text</span></li>
          </ul>
        </section>
        <section className={styles.panel} aria-live="polite">
          {!done ? (
            <>
              <p className={styles.eyebrow}>Set up on this phone</p>
              <header className={styles.panelHeader}>
                <h2>Sign {parentName} in</h2>
                <p>The caregiver enters this once. {cap(parentName)} won’t need to see or remember the password.</p>
              </header>
              <form onSubmit={signIn}>
                <div className={styles.inputGroup}>
                  <label htmlFor="semail">{cap(parentName)}’s email</label>
                  <input id="semail" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required data-testid="setup-email" />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="spw">Password created for {parentName}</label>
                  <input id="spw" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required data-testid="setup-password" />
                </div>
                {error && <p className={styles.errorMessage} role="alert">{error}</p>}
                <button className={styles.primaryButton} type="submit" disabled={loading} data-testid="setup-signin">{loading ? 'Signing in…' : `Sign ${parentName} in`}</button>
              </form>
              <p className={styles.previewNote}>Keep the password private. {cap(parentName)} won’t need to type it again.</p>
            </>
          ) : (
            <>
              <div className={styles.successMark} aria-hidden="true">✓</div>
              <header className={styles.panelHeader}>
                <h2>{cap(parentName)}’s phone is ready</h2>
                <p>They’re signed in and will stay signed in for 90 days.</p>
              </header>
              <div className={styles.notice}>Add this page to the home screen so {parentName} can easily find the help button.</div>
              <a href="/" className={styles.primaryButton} data-testid="setup-go-home">Show {parentName}’s Home screen</a>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ParentFirstSignIn() {
  return <Suspense><ParentFirstSignInForm /></Suspense>;
}
