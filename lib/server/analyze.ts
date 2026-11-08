import 'server-only';
import type { AnalyzeResult } from '@/lib/contracts';
import { analyzeText } from '../analyze-core';

export function analyze(input: { text: string }): Promise<AnalyzeResult> {
  return analyzeText(input, { apiKey: process.env.ANTHROPIC_API_KEY, fetcher: fetch });
}
