import 'server-only';
import type { AnalyzeResult } from '@/lib/contracts';
import { analyzeText } from '../analyze-core';

export function analyze(
  input: { text: string },
  options: { simulateClaudeUnavailable?: boolean } = {},
): Promise<AnalyzeResult> {
  const fetcher: typeof fetch = options.simulateClaudeUnavailable
    ? async () => { throw new Error('Claude API unavailable in this test.'); }
    : fetch;
  return analyzeText(input, { apiKey: process.env.ANTHROPIC_API_KEY, fetcher });
}
