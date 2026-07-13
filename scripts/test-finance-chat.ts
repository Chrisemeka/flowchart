/**
 * Smoke test for the finance chatbot wiring (spec §13 step 3, §14).
 *
 *   npx tsx scripts/test-finance-chat.ts
 *
 * Always runs a network-free self-check (declarations/registry parity + the
 * tool-result size cap). If TEST_USER_EMAIL / TEST_USER_PASSWORD are set in
 * .env.local, it also signs that user in and runs a real end-to-end Q&A.
 */
import assert from 'node:assert';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { FINANCE_TOOLS } from '../lib/services/finance-tools';
import { TOOL_DECLARATIONS, capToolResult, runFinanceChat } from '../lib/services/finance-chat';
import { buildSystemPrompt } from '../lib/services/finance-chat-prompt';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function selfCheck() {
  // Every declared tool maps to a real registry function, and vice versa.
  const declared = TOOL_DECLARATIONS.map((d) => d.name).sort();
  const registered = Object.keys(FINANCE_TOOLS).sort();
  assert.deepStrictEqual(declared, registered, 'TOOL_DECLARATIONS must mirror FINANCE_TOOLS');

  // Size cap trims a big array and flags truncation.
  const big = { transactions: Array.from({ length: 5000 }, (_, i) => ({ id: i, desc: 'x'.repeat(50) })) };
  const capped = capToolResult(big) as { transactions: unknown[]; truncated?: boolean };
  assert.ok(JSON.stringify(capped).length <= 30_000, 'capped result must be under 30KB');
  assert.strictEqual(capped.truncated, true, 'capped result must be flagged truncated');

  // Small results pass through untouched.
  const small = { total: 42, count: 3 };
  assert.strictEqual(capToolResult(small), small, 'small result must pass through');

  // Rolling summary (§9) is injected into the system prompt only when present.
  const withSummary = buildSystemPrompt({ banks: ['GTB'], summary: 'User asked about transport in June.' });
  assert.ok(withSummary.includes('Earlier in this conversation'), 'summary section must appear');
  assert.ok(withSummary.includes('transport in June'), 'summary text must be embedded');
  const noSummary = buildSystemPrompt({ banks: ['GTB'] });
  assert.ok(!noSummary.includes('Earlier in this conversation'), 'no summary section without a summary');

  console.log('✓ self-check passed');
}

async function liveCheck() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    console.log('· skipping live Q&A — set TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local to run it');
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    console.log('· skipping live Q&A — GEMINI_API_KEY not set');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`sign-in failed: ${error?.message}`);
  const userId = data.user.id;

  const questions = [
    'How much did I spend on transport last month?',
    'Show me my top 5 merchants this year.',
    'How much did I spend on Uber?',
  ];

  for (const q of questions) {
    console.log(`\n> ${q}`);
    const res = await runFinanceChat({ supabase, userId, message: q });
    console.log('  tools:', res.toolCalls.map((c) => c.name).join(', ') || '(none)');
    console.log('  answer:', res.text.replace(/\n/g, '\n          '));
  }
}

(async () => {
  selfCheck();
  await liveCheck();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
