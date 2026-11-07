import './globals.css';
import type { ReactNode } from 'react';
import { ReportProblem } from './report-problem';

export const metadata = { title: 'Is This a Scam?' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="preview-bar" aria-label="Design preview">
          <span>Design preview with sample data.</span>
          <a href="/">Galina&apos;s screens</a>
          <a href="/helper/signup">Alex&apos;s screens</a>
        </nav>
        {children}
        <ReportProblem />
      </body>
    </html>
  );
}
