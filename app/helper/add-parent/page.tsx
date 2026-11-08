'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthStatus } from '@/lib/contracts';
import { authRequest, friendlyAuthError, type AuthStatusWithName } from '../auth-client';
import styles from '../helper-flow.module.css';

const passwordCharacters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*_-+';

function suggestPassword() {
  const values = new Uint32Array(24);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => passwordCharacters[value % passwordCharacters.length]).join('');
}

export default function AddParent() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'phone' | 'done'>('details');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [helperPhone, setHelperPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [helperName, setHelperName] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authRequest<AuthStatusWithName>('/api/auth/me')
      .then((status) => {
        if (status.role !== 'helper') {
          router.replace(status.role === 'parent' ? '/' : '/helper/signin');
          return;
        }
        if (status.needsMfaSetup) {
          router.replace('/helper/mfa/setup');
          return;
        }
        if (status.pair) {
          router.replace('/helper');
          return;
        }
        setHelperName(status.name || '');
        setCheckingSession(false);
      })
      .catch(() => router.replace('/helper/signin'));
  }, [router]);

  async function addParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 16) {
      setPasswordError('Choose at least 16 characters, or use a suggested password.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('These passwords don’t match yet.');
      return;
    }
    setPasswordError('');
    setSubmitting(true);
    try {
      const status = await authRequest<AuthStatus>('/api/setup/parent', {
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim(),
        parentPassword: password,
        ...(helperName ? { helperName } : {}),
        ...(helperPhone.trim() ? { helperPhone: helperPhone.trim() } : {}),
      });
      if (status.role !== 'helper' || !status.pair) {
        setPasswordError('Your parent account was created, but we couldn’t confirm the connection. Please reload and check your account.');
        return;
      }
      setShowPassword(false);
      setStep('phone');
    } catch (requestError) {
      setPasswordError(friendlyAuthError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  const setupHref = `/setup?name=${encodeURIComponent(parentName.trim())}`;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro}>
          <div className={styles.brand}><span className={styles.brandMark}>✓</span> Is This a Scam?</div>
          <p className={styles.eyebrow}>Caregiver setup · Step 3 of 3</p>
          <h1>Set up your parent’s access.</h1>
          <p className={styles.introCopy}>You’ll create their password, then sign them in on their phone. They won’t need to remember it.</p>
          <ul className={styles.benefits}>
            <li className={styles.benefit}><span className={styles.check}>✓</span><span>One caregiver is connected to each parent</span></li>
            <li className={styles.benefit}><span className={styles.check}>✓</span><span>The parent stays signed in for 90 days</span></li>
            <li className={styles.benefit}><span className={styles.check}>✓</span><span>You can add your phone for the “call helper” option</span></li>
          </ul>
        </section>
        <section className={styles.panel} aria-live="polite">
          <div className={styles.stepLabel}><span>{step === 'details' ? 'Parent details' : step === 'phone' ? 'Sign-in on their phone' : 'Setup complete'}</span><span>Step 3 of 3</span></div>
          <div className={styles.progress} aria-label="Setup progress">
            <span className={styles.active} /><span className={styles.active} /><span className={styles.active} />
          </div>
          {checkingSession && <p className={styles.notice} role="status">Checking your caregiver account…</p>}
          {!checkingSession && step === 'details' && (
            <>
              <header className={styles.panelHeader}>
                <h2>Connect your parent</h2>
                <p>Add your parent’s details and create a private sign-in for them.</p>
              </header>
              <form onSubmit={addParent}>
                <div className={styles.inputGroup}>
                  <label htmlFor="pname">Your parent’s name</label>
                  <input id="pname" autoComplete="name" value={parentName} onChange={(event) => setParentName(event.target.value)} required data-testid="parent-name" />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="pemail">Your parent’s email</label>
                  <input id="pemail" type="email" autoComplete="email" value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} required data-testid="parent-email" />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="ppw">Create a password for your parent</label>
                  <p className={styles.hint}>You’ll enter this once on their phone. Keep it private; they won’t see or need to remember it.</p>
                  <div className={styles.passwordRow}>
                    <input id="ppw" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={16} value={password} onChange={(event) => { setPassword(event.target.value); setPasswordError(''); }} required data-testid="parent-password" />
                    <button type="button" className={styles.inlineButton} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                  <button type="button" className={styles.secondaryButton} onClick={() => { const suggestion = suggestPassword(); setPassword(suggestion); setConfirmPassword(suggestion); setPasswordError(''); setShowPassword(true); }} data-testid="suggest-parent-password">Suggest a strong password</button>
                  <p className={styles.hint}>Use at least 16 characters. The suggested password is 24 random characters.</p>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="confirm-pw">Confirm the password</label>
                  <input id="confirm-pw" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={16} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setPasswordError(''); }} required data-testid="parent-password-confirm" />
                {passwordError && <p className={styles.errorMessage} role="alert">{passwordError}</p>}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="hphone">Your phone number <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input id="hphone" type="tel" autoComplete="tel" value={helperPhone} onChange={(event) => setHelperPhone(event.target.value)} data-testid="helper-phone" />
                  <p className={styles.hint}>Your parent can call you if you don’t answer within 10 minutes.</p>
                </div>
                <button className={styles.primaryButton} type="submit" disabled={submitting} data-testid="add-parent">{submitting ? 'Creating their account…' : 'Create parent account'}</button>
              </form>
            </>
          )}
          {step === 'phone' && (
            <>
              <header className={styles.panelHeader}>
                <h2>Sign {parentName || 'your parent'} in</h2>
                <p>Use their phone to finish setup. Keep this helper page open so you can refer to the password.</p>
              </header>
              <div className={styles.notice}>
                <strong>On your parent’s phone</strong>
                <ol className={styles.stepsList}>
                  <li>Open the Is This a Scam? website.</li>
                  <li>Tap “I’m setting this up for my parent.”</li>
                  <li>Enter their email and the password below.</li>
                  <li>Add the page to their home screen.</li>
                </ol>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="parent-password-for-setup">Password to enter on their phone</label>
                <div className={styles.passwordRow}>
                  <input id="parent-password-for-setup" type={showPassword ? 'text' : 'password'} value={password} readOnly aria-label="Password created for your parent" data-testid="parent-password-for-setup" />
                  <button type="button" className={styles.inlineButton} onClick={() => setShowPassword(!showPassword)} data-testid="toggle-parent-password">{showPassword ? 'Hide' : 'Show'}</button>
                </div>
                <p className={styles.hint}>Keep this private. Your parent won’t need to know it.</p>
              </div>
              <div className={styles.notice}>Their sign-in will stay active for 90 days.</div>
              <a href={setupHref} target="_blank" rel="noreferrer" className={styles.primaryButton} data-testid="see-parent-signin">Open setup on your parent’s phone</a>
              <button className={styles.secondaryButton} onClick={() => setStep('done')} data-testid="parent-signed-in">Their phone is ready</button>
            </>
          )}
          {step === 'done' && (
            <>
              <div className={styles.successMark} aria-hidden="true">✓</div>
              <header className={styles.panelHeader}>
                <h2>You’re connected</h2>
                <p>When {parentName || 'your parent'} asks for help, you’ll get an email and can answer with one tap.</p>
              </header>
              <div className={styles.notice}><strong>One caregiver connected</strong><br />Only you can see and answer {parentName || 'your parent'}’s checks.</div>
              <a href="/helper" className={styles.primaryButton}>Go to caregiver home</a>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
