'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type CreateCheckResponse = { check: { id: string }; helperNotified: boolean };
type ApiError = { error?: { message?: string } };

export default function PasteMessage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) {
      setError('Please paste the message first.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const body = await response.json().catch(() => ({})) as CreateCheckResponse & ApiError;
      if (!response.ok || !body.check?.id) {
        throw new Error(body.error?.message ?? 'We could not check that message. Please try again.');
      }
      const notice = body.helperNotified ? '' : '?helperNotified=false';
      router.push(`/check/${encodeURIComponent(body.check.id)}${notice}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'We could not check that message. Please try again.');
      setSubmitting(false);
    }
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
          onChange={(event) => { setText(event.target.value); setError(''); }}
          placeholder="Paste the text, email or link"
          disabled={submitting}
        />
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn" type="submit" data-testid="submit-check" disabled={submitting}>
          {submitting ? 'Checking…' : 'Check this message'}
        </button>
      </form>
      <a href="/" className="btn secondary">Go back</a>
    </main>
  );
}
