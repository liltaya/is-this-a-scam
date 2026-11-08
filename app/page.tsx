'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './check/parent-experience.module.css';

type Me = {
  status: 'signed_in';
  role: 'parent' | 'helper' | null;
  name?: string;
  pair?: { helperName: string } | null;
};

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (response) => (response.ok ? (await response.json()) as Me : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const parentName = me?.role === 'parent' ? me.name : undefined;
  const helperName = me?.role === 'parent' ? me.pair?.helperName : undefined;

  return (
    <main className={styles.parent}>
      {parentName && <p className="muted">Hello, {parentName}.</p>}
      <h1>Got a message that worries you?</h1>
      <Link href="/check" className="btn big" data-testid="start-check">
        Is this a scam?
      </Link>
      <p className="muted">
        Tap the button, paste the message, and {helperName ?? 'your helper'} will tell you what they think.
      </p>
    </main>
  );
}
