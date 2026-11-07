'use client';
import { useState } from 'react';

export default function HelperSignUp() {
  const [step, setStep] = useState<'account' | 'mfa'>('account');
  return (
    <main>
      <p className="steps">For family helpers</p>
      {step === 'account' ? (
        <>
          <h1>Help your parent spot scams</h1>
          <p className="muted">
            Your parent sends you messages they&apos;re unsure about. You answer with one tap.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); setStep('mfa'); }}>
            <label htmlFor="name">Your first name</label>
            <input id="name" defaultValue="Alex" data-testid="helper-name" />
            <label htmlFor="email">Your email</label>
            <input id="email" type="email" defaultValue="alex@example.com" data-testid="helper-email" />
            <label htmlFor="pw">Choose a password</label>
            <input id="pw" type="password" defaultValue="preview-only" data-testid="helper-password" />
            <button className="btn" type="submit" data-testid="helper-signup">Create my account</button>
          </form>
          <p className="muted">Parents don&apos;t sign up here. You&apos;ll add your parent next.</p>
        </>
      ) : (
        <>
          <h1>Protect your account</h1>
          <p>You&apos;ll see your parent&apos;s messages, so your account needs a second step at sign-in.</p>
          <div className="card">
            <strong>Use an authenticator app</strong>
            <p className="muted">Scan the code with Google Authenticator, 1Password or similar, then type the 6 digits.</p>
            <div aria-label="QR code placeholder" style={{ width: 160, height: 160, background: 'repeating-linear-gradient(45deg,#1d1b18 0 8px,#fff 8px 16px)', borderRadius: 8, margin: '12px 0' }} />
            <label htmlFor="code">6-digit code</label>
            <input id="code" inputMode="numeric" defaultValue="123456" data-testid="mfa-code" />
          </div>
          <p className="muted">Or get the code by email instead.</p>
          <a href="/helper/add-parent" className="btn" data-testid="mfa-confirm">Continue</a>
        </>
      )}
    </main>
  );
}
