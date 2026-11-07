'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { findCheck, pair, type Risk } from '@/lib/sample-data';

// Wording from docs/contracts.md, "Helper alert email" (template check_alert). No message text in the email.
const emailRiskLabel: Record<Risk, string> = {
  red: 'Several warning signs',
  yellow: 'A few warning signs',
  green: 'No obvious warning signs',
};

function Email() {
  const id = useSearchParams().get('id') || 'c1';
  const check = findCheck(id) ?? findCheck('c1')!;
  const reviewLink = `https://is-this-a-scam.apps.piezas.ai/helper/checks/${check.id}`;
  return (
    <main>
      <p className="steps">The email {pair.helperName} gets</p>
      <div className="card" data-testid="alert-email">
        <p className="muted" style={{ fontSize: 15, margin: 0 }}>To: alex@example.com</p>
        <p data-testid="email-subject" style={{ marginTop: 4 }}>
          <strong>{pair.parentName} would like your opinion on a message</strong>
        </p>
        <hr style={{ border: 0, borderTop: '1px solid var(--line)' }} />
        <div data-testid="email-body" style={{ whiteSpace: 'pre-wrap' }}>
          <p>Hi {pair.helperName},</p>
          <p>{pair.parentName} just received a message and wants to check it with you before doing anything.</p>
          <p>Our first look: <strong data-testid="email-risk">{emailRiskLabel[check.risk]}</strong></p>
          <p>Open it here and answer in one tap:<br />
            <a href={`/helper/checks/${check.id}`} data-testid="email-link">{reviewLink}</a>
          </p>
          <p>Thank you for looking out for them.<br />Is This a Scam?</p>
        </div>
      </div>
      <p className="muted">The message itself is never in the email. {pair.helperName} sees it only after signing in.</p>
      <div className="preview-tools">
        Preview only, other checks:{' '}
        <a href="?id=c1">Gift cards</a>
        <a href="?id=c4">Card number (**** 1111)</a>
        <a href="?id=c3">Pharmacy</a>
      </div>
    </main>
  );
}

export default function Page() {
  return <Suspense><Email /></Suspense>;
}
