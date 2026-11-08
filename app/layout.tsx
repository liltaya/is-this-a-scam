import './globals.css';
import type { ReactNode } from 'react';
import { ReportProblem } from './report-problem';

export const metadata = { title: 'Is This a Scam?' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ReportProblem />
      </body>
    </html>
  );
}
