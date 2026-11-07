'use client';
import { useState } from 'react';
import { pair } from '@/lib/sample-data';

// Shown on the parent's phone. The helper types here once; the parent never sees or types a password.
export default function ParentFirstSignIn() {
  const [done, setDone] = useState(false);
  return (
    <main>
      <p className="steps">I&apos;m setting this up for my parent</p>
      {!done ? (
        <>
          <h1>Sign {pair.parentName} in</h1>
          <p className="muted">Type this on {pair.parentName}&apos;s phone. She stays signed in for 90 days.</p>
          <form onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
            <label htmlFor="semail">{pair.parentName}&apos;s email</label>
            <input id="semail" type="email" defaultValue="galina@example.com" data-testid="setup-email" />
            <label htmlFor="spw">The password you chose for her</label>
            <input id="spw" type="password" defaultValue="preview-only" data-testid="setup-password" />
            <button className="btn" type="submit" data-testid="setup-signin">Sign {pair.parentName} in</button>
          </form>
        </>
      ) : (
        <>
          <h1>{pair.parentName}&apos;s phone is ready</h1>
          <p>Add this page to her home screen so she can find the button.</p>
          <a href="/" className="btn" data-testid="setup-go-home">Show {pair.parentName}&apos;s Home screen</a>
        </>
      )}
    </main>
  );
}
