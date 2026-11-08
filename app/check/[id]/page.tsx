'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Check, Flag, FlagType, Pair } from '@/lib/contracts';
import styles from '../parent-experience.module.css';

type ApiError = { error?: { message?: string } };
const POLL_MS = 3_000;
const WAIT_MS = 10 * 60 * 1_000;

const flagLabel: Record<FlagType, string> = {
  urgency: 'Rush', money: 'Money', gift_cards: 'Gift cards', codes: 'Asks for codes or details',
  secrecy: 'Secrecy', impersonation: 'Pretends to be someone', link: 'Strange link', other: 'Other warning sign',
};

function highlightedMessage(text: string, flags: Flag[]) {
  const quotes = [...new Set(flags.map((flag) => flag.quote).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!quotes.length) return text;
  const escaped = quotes.map((quote) => quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  const flagged = new Set(quotes.map((quote) => quote.toLowerCase()));
  return parts.map((part, index) => flagged.has(part.toLowerCase()) ? <mark key={index}>{part}</mark> : part);
}

export default function Result({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const search = useSearchParams();
  const [check, setCheck] = useState<Check | null>(null);
  const [pair, setPair] = useState<Pair | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const helperNotified = search.get('helperNotified') !== 'false';

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/checks/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const body = await response.json().catch(() => ({})) as { check?: Check } & ApiError;
        if (!response.ok || !body.check) throw new Error(body.error?.message ?? 'We could not find that check.');
        if (active) { setCheck(body.check); setError(''); }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'We could not find that check.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    fetch('/api/pair', { cache: 'no-store' })
      .then(async (response) => response.ok ? (await response.json()) as { pair: Pair } : null)
      .then((body) => { if (active && body) setPair(body.pair); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!check || check.helperAnswer !== 'pending' || check.textClearedAt || !helperNotified) return;
    const timer = window.setInterval(() => {
      fetch(`/api/checks/${encodeURIComponent(id)}`, { cache: 'no-store' })
        .then(async (response) => response.ok ? (await response.json()) as { check: Check } : null)
        .then((body) => { if (body) setCheck(body.check); })
        .catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [check?.helperAnswer, check?.textClearedAt, helperNotified, id]);

  const fallback = Boolean(check && check.helperAnswer === 'pending' && (!helperNotified || Date.now() - Date.parse(check.createdAt) >= WAIT_MS));
  const message = useMemo(() => check?.maskedText ? highlightedMessage(check.maskedText, check.flags) : null, [check]);
  const helperName = pair?.helperName ?? 'your helper';

  if (loading) return <main className={styles.parent}><p>Loading…</p></main>;
  if (error || !check) return <main className={styles.parent}><h1>Not found</h1><p className="muted">{error || 'This check doesn’t exist or isn’t yours.'}</p><a href="/" className="btn">Go home</a></main>;

  return (
    <main className={styles.parent}>
      {check.helperAnswer === 'scam' && <><div className="answer scam" data-testid="helper-answer">Scam.<br />Don&apos;t reply or pay.</div><p className="muted">{helperName} checked it for you.</p></>}
      {check.helperAnswer === 'safe' && <><div className="answer safe" data-testid="helper-answer">All good.</div><p className="muted">{helperName} checked it for you.</p></>}
      {check.helperNote && <p className="note">“{check.helperNote}” — {helperName}</p>}

      {check.helperAnswer === 'pending' && <>
        <div className={`risk ${check.risk}`} data-testid="risk">{check.risk === 'red' ? 'Looks like a scam' : check.risk === 'yellow' ? 'Be careful' : 'No warning signs found'}</div>
        <p>{check.summary}</p>
        {fallback ? <><div className="fallback" data-testid="fallback">Don&apos;t pay or reply until you talk to someone you trust.</div>{pair?.helperPhone && <a href={`tel:${pair.helperPhone.replace(/\s/g, '')}`} className="btn" data-testid="call-helper">Call {helperName}</a>}</> : <div className="waiting" data-testid="waiting"><span className="dot" aria-hidden="true" />Waiting for {helperName}…</div>}
        <p className="muted">Don&apos;t reply, click links or pay while you wait.</p>
      </>}

      {check.textClearedAt ? <p className="card">This message was cleared after 30 days.</p> : <>
        <h2>The message</h2>
        <p className="message" data-testid="masked-text">{message}</p>
        {check.maskedText?.includes('****') && <p className="masked-note" data-testid="masked-note">🔒 We hid card and account numbers before saving this message.</p>}
        {check.flags.length > 0 && <section aria-labelledby="flags"><h2 id="flags">What we noticed</h2>{check.flags.map((flag, index) => <div className={`flag ${flag.source}`} key={`${flag.type}-${index}`} data-testid="flag"><strong>{flagLabel[flag.type]}</strong><q>{flag.quote}</q><p>{flag.explain}</p></div>)}</section>}
      </>}
      <a href="/" className="btn secondary">Done</a>
    </main>
  );
}
