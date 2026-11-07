'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { findCheck, pair, riskLabel } from '@/lib/sample-data';

export default function ReviewCheck({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const check = findCheck(id);
  const [note, setNote] = useState('');

  if (!check) return <main><h1>Not found</h1><p className="muted">This check doesn&apos;t exist or isn&apos;t yours.</p></main>;

  const answered = check.helperAnswer !== 'pending';
  const send = (a: 'scam' | 'safe') => router.push(`/helper/sent?id=${check.id}&answer=${a}`);

  return (
    <main>
      <p className="steps">{pair.parentName} asked you to check this</p>
      <h1>Is this a scam?</h1>
      <div className={`risk ${check.risk}`}>{riskLabel[check.risk]}</div>
      <p>{check.summary}</p>
      <h2>The message</h2>
      <p className="message" data-testid="masked-text">{check.maskedText}</p>
      {check.maskedText.includes('****') && (
        <p className="masked-note" data-testid="masked-note">🔒 We hid card and account numbers before saving this message.</p>
      )}
      {answered ? (
        <div className="card" data-testid="already-answered">
          You already answered: <strong>{check.helperAnswer === 'scam' ? 'Scam' : 'All good'}</strong>. Each check can be answered once.
        </div>
      ) : (
        <>
          <label htmlFor="note">Add a note for {pair.parentName} (optional)</label>
          <textarea id="note" maxLength={200} style={{ minHeight: 90 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mom, delete it. I'll call you tonight." />
          <p className="muted" style={{ fontSize: 15 }}>{200 - note.length} characters left</p>
          <button className="btn danger" onClick={() => send('scam')} data-testid="answer-scam">Scam</button>
          <button className="btn ok" onClick={() => send('safe')} data-testid="answer-safe">All good</button>
        </>
      )}
      {check.flags.length > 0 && (
        <>
          <h2>What we noticed</h2>
          {check.flags.map((f, i) => (
            <div className={`flag ${f.source}`} key={i}>
              <strong>{f.type} <span className="muted" style={{ fontWeight: 400, fontSize: 15 }}>({f.source === 'ai' ? 'AI' : 'keyword rule'})</span></strong>
              <q>{f.quote}</q>
              <p>{f.explanation}</p>
            </div>
          ))}
        </>
      )}
      <div className="preview-tools">
        Preview only: <a href="/helper/checks/c1">waiting for you</a><a href="/helper/checks/c2">already answered</a><a href="/helper/checks/c4">card number</a><a href={`/preview/email?id=${check.id}`}>the email Alex got</a>
      </div>
    </main>
  );
}
