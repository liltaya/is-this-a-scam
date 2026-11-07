'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { maskNumbers } from '@/lib/mask';
import { runRules } from '@/lib/rules';

export default function PasteMessage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please paste the message first.');
      return;
    }
    // Preview only: the real app does this on the server and saves the check in Piezas.
    const masked = maskNumbers(text);
    const { risk, flags } = runRules(masked);
    sessionStorage.setItem('preview-check', JSON.stringify({ maskedText: masked, risk, flags }));
    router.push('/check/new');
  }

  return (
    <main>
      <p className="steps">Step 1 of 2</p>
      <h1>Paste the message here</h1>
      <p className="muted">Press and hold in the box, then tap Paste.</p>
      <form onSubmit={submit}>
        <textarea
          aria-label="The message"
          data-testid="message-input"
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); }}
          placeholder="Paste the text, email or link"
        />
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn" type="submit" data-testid="submit-check">Check this message</button>
      </form>
      <a href="/" className="btn secondary">Go back</a>
    </main>
  );
}
