'use client';
import { mountReportProblem } from '@piezas/sdk/report-problem';

// Added by Piezas. Mounted when this file loads, outside React, so the button
// outlives a crash. Whether it shows is the owner's answer at each deploy.
if (typeof window !== 'undefined') mountReportProblem();

export function ReportProblem() {
  return null;
}
