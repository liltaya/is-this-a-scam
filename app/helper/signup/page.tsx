'use client';

import { useState, type FormEvent } from 'react';
import styles from '../helper-flow.module.css';
import { authRequest, friendlyAuthError } from '../auth-client';

export default function HelperSignUp() {
  const [step, setStep] = useState<'account' | 'verification'>('account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authRequest<{ status: 'verify_email' }>('/api/auth/signup', { name, email, password });
      setPassword('');
      setStep('verification');
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
          <p className={styles.eyebrow}>A little backup when it matters</p>
          <h1>Help your parent feel safer with every message.</h1>
          <p className={styles.introCopy}>When they’re unsure about a text, they can ask you before replying. You’ll get the warning signs and can answer in one tap.</p>
          <ul className={styles.benefits}>
            <li className={styles.benefit}><span className={styles.check}>✓</span><span>Private alerts sent directly to you</span></li>
            <li className={styles.benefit}><span className={styles.check}>✓</span><span>You decide what advice your parent sees</span></li>
            <li className={styles.benefit}><span className={styles.check}>✓</span><span>Only one caregiver is connected to each parent</span></li>
          </ul>
        </section>
        <section className={styles.panel} aria-labelledby="signup-title">
          <div className={styles.stepLabel}><span>Caregiver setup</span><span>Step 1 of 3</span></div>
          <div className={styles.progress} aria-label="Setup progress">
            <span className={styles.active} /><span /><span />
          </div>
          {step === 'account' ? (
            <>
              <header className={styles.panelHeader}>
                <h2 id="signup-title">Create your account</h2>
                <p>Start with your details. You’ll secure your account before adding your parent.</p>
              </header>
              <form onSubmit={createAccount}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Your name</label>
                  <input id="name" autoComplete="given-name" value={name} onChange={(event) => setName(event.target.value)} required data-testid="helper-name" />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="email">Email address</label>
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required data-testid="helper-email" />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="pw">Create a password</label>
                  <div className={styles.passwordRow}>
                    <input id="pw" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required data-testid="helper-password" />
                    <button type="button" className={styles.inlineButton} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                  <p className={styles.hint}>Use at least 12 characters. This password protects your caregiver account.</p>
                </div>
                {error && <p className={styles.errorMessage} role="alert">{error}</p>}
                <button className={styles.primaryButton} type="submit" disabled={loading} data-testid="helper-signup">{loading ? 'Creating your account…' : 'Create helper account'}</button>
              </form>
              <div className={styles.notice}>Parents don’t sign up here. You’ll create their account after confirming your email and securing your account.</div>
            </>
          ) : (
            <>
              <header className={styles.panelHeader}>
                <h2 id="signup-title">Check your email</h2>
                <p>We sent a confirmation link to <strong>{email}</strong>.</p>
              </header>
              <div className={styles.successMessage} role="status">Open the email and confirm your address. The link will return you here to continue setup.</div>
              <a href="/helper/signin" className={styles.primaryButton} data-testid="go-to-signin">I’ve confirmed — sign in</a>
              <button className={styles.secondaryButton} type="button" onClick={() => setStep('account')}>Back to account details</button>
            </>
          )}
          <p className={styles.previewNote}>Your parent won’t need to manage this account.</p>
        </section>
      </div>
    </main>
  );
}
