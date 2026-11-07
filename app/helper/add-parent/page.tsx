'use client';
import { useState } from 'react';

export default function AddParent() {
  const [step, setStep] = useState<'details' | 'phone' | 'done'>('details');
  return (
    <main>
      <p className="steps">Set up your parent</p>
      {step === 'details' && (
        <>
          <h1>Add your parent</h1>
          <form onSubmit={(e) => { e.preventDefault(); setStep('phone'); }}>
            <label htmlFor="pname">Their first name</label>
            <input id="pname" defaultValue="Galina" data-testid="parent-name" />
            <label htmlFor="pemail">Their email</label>
            <input id="pemail" type="email" defaultValue="galina@example.com" data-testid="parent-email" />
            <label htmlFor="ppw">Choose a password for them</label>
            <input id="ppw" type="password" defaultValue="preview-only" data-testid="parent-password" />
            <p className="muted">They will never need it. You type it once on their phone, and they stay signed in for 90 days.</p>
            <label htmlFor="hphone">Your phone number (optional)</label>
            <input id="hphone" type="tel" defaultValue="+1 604 555 0142" data-testid="helper-phone" />
            <p className="muted">Shows a &ldquo;Call Alex&rdquo; button if you don&apos;t answer within 10 minutes.</p>
            <button className="btn" type="submit" data-testid="add-parent">Add Galina</button>
          </form>
        </>
      )}
      {step === 'phone' && (
        <>
          <h1>Now sign Galina in on her phone</h1>
          <ol>
            <li>On Galina&apos;s phone, open <strong>is-this-a-scam.apps.piezas.ai</strong>.</li>
            <li>Tap &ldquo;I&apos;m setting this up for my parent&rdquo;.</li>
            <li>Type Galina&apos;s email and the password you just chose.</li>
            <li>Add the page to her home screen so she can find it.</li>
          </ol>
          <a href="/setup" className="btn secondary" data-testid="see-parent-signin">See the screen on Galina&apos;s phone</a>
          <button className="btn" onClick={() => setStep('done')} data-testid="parent-signed-in">Galina&apos;s phone is ready</button>
        </>
      )}
      {step === 'done' && (
        <>
          <h1>All set</h1>
          <p>When Galina checks a message, we&apos;ll email you a link. Answer with one tap.</p>
          <a href="/helper/checks/c1" className="btn secondary">See what a check looks like</a>
        </>
      )}
    </main>
  );
}
