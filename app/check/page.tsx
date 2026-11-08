'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { Check } from '@/lib/contracts';

type CreateCheckResponse = { check: Check; helperNotified: boolean };
type ApiErrorResponse = { error?: { code?: string; message?: string } };

export default function PasteMessage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = text.trim();
    if (!message) {
      setError('Please paste the message first.');
      return;
    }
    if (message.length > 5000) {
      setError('That message is too long. Please paste a shorter part of it.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/checks', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
      const result = await response.json() as CreateCheckResponse | ApiErrorResponse;
      if (!response.ok) {
        const apiError = (result as ApiErrorResponse).error;
        if (apiError?.code === 'signed_out') {
          setError('Please sign in again before checking a message.');
        } else {
          setError(apiError?.message || 'We couldn’t check this message right now. Please try again.');
        }
        return;
      }

      const created = result as CreateCheckResponse;
      const alert = created.helperNotified ? '' : '?alert=failed';
      router.push(`/check/${encodeURIComponent(created.check.id)}${alert}`);
    } catch {
      setError('We couldn’t reach SafeLine. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <p className="steps">Step 1 of 2</p>
      <h1>Paste the message here</h1>
      <p className="muted">Press and hold in the box, then tap Paste. We hide account and verification numbers before saving or reviewing it.</p>
      <form onSubmit={submit}>
        <textarea
          aria-label="The message"
          data-testid="message-input"
          value={text}
          maxLength={5000}
          onChange={(event) => { setText(event.target.value); setError(''); }}
          placeholder="Paste the text, email or link"
          required
        />
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={submitting} data-testid="submit-check">
          {submitting ? 'Checking…' : 'Check this message'}
        </button>
      </form>
      <a href="/" className="btn secondary">Go back</a>
    </main>
  );
}
