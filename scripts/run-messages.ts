import { ANALYZE_MODEL, analyzeWithModel } from '../lib/ai/analyze';
import { TEST_MESSAGES } from './test-messages';

// Runs the test messages through analyze() and checks the targets:
// every scam red or yellow, and no normal message red.
// Usage: npm run check:messages, or npm run check:messages -- --model claude-sonnet-5-5 to compare models.
const modelFlag = process.argv.indexOf('--model');
const model = modelFlag > -1 ? process.argv[modelFlag + 1] : ANALYZE_MODEL;

if (!process.env.ANTHROPIC_API_KEY) console.log('No ANTHROPIC_API_KEY set, so this runs the keyword rules only.');
console.log(`model: ${model}\n`);

let failures = 0;
for (const message of TEST_MESSAGES) {
  const result = await analyzeWithModel(message.text, model);
  const pass = message.kind === 'scam' ? result.risk !== 'green' : result.risk !== 'red';
  if (!pass) failures++;
  const flags = result.flags.map((f) => f.type).join(', ');
  console.log(`${pass ? 'PASS' : 'FAIL'} ${message.id.padEnd(10)} ${result.risk.padEnd(7)} ${result.engine.padEnd(10)} ${flags}`);
}

console.log(`\n${TEST_MESSAGES.length - failures} of ${TEST_MESSAGES.length} passed`);
process.exitCode = failures ? 1 : 0;
