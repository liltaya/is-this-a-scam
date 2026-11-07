'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { pair } from '@/lib/sample-data';

function Sent() {
  const q = useSearchParams();
  const answer = q.get('answer') === 'safe' ? 'All good' : 'Scam';
  const id = q.get('id') || 'c1';
  return (
    <main>
      <h1 data-testid="sent">Sent. {pair.parentName} sees your answer now.</h1>
      <p>You answered <strong>{answer}</strong>.</p>
      <a href={`/check/${id}?view=${answer === 'Scam' ? 'scam' : 'safe'}`} className="btn secondary">See what {pair.parentName} sees</a>
    </main>
  );
}

export default function Page() {
  return <Suspense><Sent /></Suspense>;
}
