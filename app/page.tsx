import Link from 'next/link';
import { pair } from '@/lib/sample-data';

export default function Home() {
  return (
    <main>
      <p className="muted">Hello, {pair.parentName}.</p>
      <h1>Got a message that worries you?</h1>
      <Link href="/check" className="btn big" data-testid="start-check">
        Is this a scam?
      </Link>
      <p className="muted">
        Tap the button, paste the message, and {pair.helperName} will tell you if it is safe.
      </p>
    </main>
  );
}
