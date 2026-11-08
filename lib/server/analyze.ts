// The app's entry point to the scam engine. 'server-only' makes the build fail if
// browser code ever imports this, so ANTHROPIC_API_KEY and the engine stay on the
// server. Scripts and unit tests import lib/ai/analyze directly instead.
import 'server-only';

export { analyze } from '@/lib/ai/analyze';
