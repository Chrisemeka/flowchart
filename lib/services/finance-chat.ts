import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type EnumStringSchema,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai';
import { SupabaseClient } from '@supabase/supabase-js';

import { TRANSACTION_CATEGORIES } from '../constants';
import { FINANCE_TOOLS, FinanceToolName, listBanks } from './finance-tools';
import { buildSystemPrompt } from './finance-chat-prompt';

// --- Security caps (spec §11) ---
const MAX_MESSAGE_CHARS = 2000;
const MAX_TOOL_ITERATIONS = 6;
const MAX_TOOL_JSON_BYTES = 30_000;

// Reused parameter fragments.
const dateRangeProps = {
  startDate: { type: SchemaType.STRING, description: 'Inclusive start date, ISO YYYY-MM-DD.' },
  endDate: { type: SchemaType.STRING, description: 'Inclusive end date, ISO YYYY-MM-DD.' },
} as const;
const bankProp = {
  type: SchemaType.STRING,
  description: 'Optional bank name to scope the query to a single bank. Omit for all banks.',
} as const;
const categoryEnum: EnumStringSchema = {
  type: SchemaType.STRING,
  format: 'enum',
  enum: [...TRANSACTION_CATEGORIES],
};

/**
 * Gemini function declarations mirroring the FINANCE_TOOLS registry (spec §5/§6).
 * user_id is intentionally NOT a parameter — the model never sees it (§11).
 */
export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'listBanks',
    description: 'List the distinct banks the user has uploaded statements for.',
  },
  {
    name: 'listCategories',
    description: 'List the transaction categories that actually appear in the user\'s data.',
  },
  {
    name: 'listStatementPeriods',
    description:
      'List every uploaded statement with its bank, month, year and covered date range. Use this to discover what date ranges are available.',
  },
  {
    name: 'getSpendingByCategory',
    description:
      'Total debits (money spent) in a single category over a date range. Use for "how much did I spend on X".',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category: { ...categoryEnum, description: 'The spending category.' },
        ...dateRangeProps,
        bank: bankProp,
      },
      required: ['category', 'startDate', 'endDate'],
    },
  },
  {
    name: 'getSpendingBreakdown',
    description:
      'Per-category debit/credit totals over a date range. Use when the user asks about several categories at once or "where did my money go by category".',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { ...dateRangeProps, bank: bankProp },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'getIncomeVsExpense',
    description: 'Total income, total expense and net for a date range.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { ...dateRangeProps, bank: bankProp },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'getTopMerchants',
    description:
      'Top merchants by amount spent over a date range. Use for "where did my money go" / "top merchants".',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ...dateRangeProps,
        limit: { type: SchemaType.INTEGER, description: 'How many merchants to return (default 10, max 50).' },
        bank: bankProp,
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'getTransactions',
    description:
      'A bounded list of individual transactions matching filters. Use search to find a named merchant (e.g. "uber"). Max 200 rows.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ...dateRangeProps,
        category: { ...categoryEnum, description: 'Optional category filter.' },
        minAmount: { type: SchemaType.NUMBER, description: 'Optional minimum amount.' },
        maxAmount: { type: SchemaType.NUMBER, description: 'Optional maximum amount.' },
        search: {
          type: SchemaType.STRING,
          description: 'Optional text matched against the transaction description (merchant name).',
        },
        type: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['Debit', 'Credit'],
          description: 'Optional filter: Debit (spending) or Credit (incoming).',
        },
        bank: bankProp,
        limit: { type: SchemaType.INTEGER, description: 'Row limit (default 50, hard cap 200).' },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'compareRanges',
    description:
      'Compare spending between two date ranges. Use for "June vs May" / "this year vs last". groupBy=category for per-category deltas, bank for per-bank, total for a single number.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        rangeA: {
          type: SchemaType.OBJECT,
          description: 'The first (earlier) date range.',
          properties: { ...dateRangeProps },
          required: ['startDate', 'endDate'],
        },
        rangeB: {
          type: SchemaType.OBJECT,
          description: 'The second (later) date range.',
          properties: { ...dateRangeProps },
          required: ['startDate', 'endDate'],
        },
        groupBy: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['category', 'bank', 'total'],
          description: 'How to break down the comparison. Defaults to total.',
        },
      },
      required: ['rangeA', 'rangeB'],
    },
  },
  {
    name: 'getBalanceOverTime',
    description: 'Income, expense and net bucketed by day, week or month over a date range. Use for trends.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ...dateRangeProps,
        granularity: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['day', 'week', 'month'],
          description: 'Bucket size.',
        },
        bank: bankProp,
      },
      required: ['startDate', 'endDate', 'granularity'],
    },
  },
];

export type ToolCallRecord = {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
};

export type FinanceChatResult = {
  text: string;
  toolCalls: ToolCallRecord[];
};

/**
 * Keep the JSON handed back to Gemini under the size cap (§11). Trims the
 * largest array-valued property in place and marks truncated:true.
 */
export function capToolResult(result: unknown): unknown {
  if (JSON.stringify(result).length <= MAX_TOOL_JSON_BYTES) return result;

  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    const arrayKey = Object.keys(obj).find((k) => Array.isArray(obj[k]));
    if (arrayKey) {
      const arr = obj[arrayKey] as unknown[];
      while (arr.length > 1 && JSON.stringify(obj).length > MAX_TOOL_JSON_BYTES) {
        arr.length = Math.floor(arr.length / 2);
      }
      obj.truncated = true;
      return obj;
    }
  }
  return { truncated: true, note: 'Result too large to return in full.' };
}

/**
 * Run one user turn through Gemini with the finance tools (spec §6).
 * Runs the full tool-call loop and returns the final text plus the tool calls
 * made. Pass `onToken` to stream the answer as it's generated (used by
 * /api/chat); omit it for a plain non-streaming call.
 */
export async function runFinanceChat(params: {
  supabase: SupabaseClient;
  userId: string;
  message: string;
  history?: Content[];
  banks?: string[];
  today?: string;
  summary?: string | null;
  onToken?: (token: string) => void | Promise<void>;
  onToolCall?: (call: ToolCallRecord) => void | Promise<void>;
}): Promise<FinanceChatResult> {
  const { supabase, userId, message, history = [], onToken, onToolCall } = params;

  const trimmed = message.trim();
  if (!trimmed) throw new Error('Message is empty.');
  if (trimmed.length > MAX_MESSAGE_CHARS) {
    throw new Error(`Message exceeds ${MAX_MESSAGE_CHARS} character limit.`);
  }
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set.');

  const banks = params.banks ?? (await listBanks(supabase, userId)).banks;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: buildSystemPrompt({ banks, today: params.today, summary: params.summary }),
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    generationConfig: { temperature: 0.2 },
  });

  const chat = model.startChat({ history });
  const toolCalls: ToolCallRecord[] = [];

  // Stream each turn; text chunks go to onToken as they arrive, then we await
  // the aggregated response to inspect its function calls.
  const send = async (msg: string | Part[]) => {
    const { stream, response } = await chat.sendMessageStream(msg);
    if (onToken) {
      for await (const chunk of stream) {
        const t = chunk.text();
        if (t) await onToken(t);
      }
    }
    return response;
  };

  let response = await send(trimmed);

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const calls = response.functionCalls(); //the model may have requested a tool call (§6)
    if (!calls?.length) return { text: response.text(), toolCalls };

    const responseParts: Part[] = await Promise.all(
      calls.map(async (call): Promise<Part> => {
        const args = (call.args ?? {}) as Record<string, unknown>;
        // Log name + args (not results), dev only (§11).
        if (process.env.NODE_ENV !== 'production') {
          console.log('[finance-chat] tool', call.name, JSON.stringify(args));
        }

        const fn = FINANCE_TOOLS[call.name as FinanceToolName] as
          | ((s: SupabaseClient, u: string, a?: unknown) => Promise<unknown>)
          | undefined;

        let out: unknown;
        if (!fn) {
          out = { error: 'unknown tool' };
        } else {
          try {
            out = capToolResult(await fn(supabase, userId, args));
          } catch (err) {
            // Never leak raw Supabase errors to the model/client (§11).
            console.error('[finance-chat] tool failed', call.name, err);
            out = { error: 'Could not fetch that data.' };
          }
        }

        const record = { name: call.name, args, result: out };
        toolCalls.push(record);
        await onToolCall?.(record);

        return { functionResponse: { name: call.name, response: out as object } };
      })
    );

    response = await send(responseParts);
  }

  // Loop cap exceeded (§11).
  return {
    text: "I couldn't complete that, try being more specific.",
    toolCalls,
  };
}

// --- Rolling summary (spec §9) ---
const SUMMARY_MSG_THRESHOLD = 30; // start summarising once a session passes this
const RECENT_KEEP = 20; // messages the route keeps in live history; older ones go to the summary

/**
 * Regenerate a session's rolling summary once it has enough history (§9). Meant
 * to run in the background (Next `after()`), so it never throws — failures are
 * logged and skipped. Older user/assistant turns (everything before the recent
 * window) are folded into the existing summary in 3-5 sentences.
 *
 * ponytail: re-summarises the whole older window each time rather than tracking
 * a cursor — no schema column needed; revisit if sessions grow into the hundreds.
 */
export async function maybeSummarizeSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  try {
    if (!process.env.GEMINI_API_KEY) return;

    const { count } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    if ((count ?? 0) <= SUMMARY_MSG_THRESHOLD) return;

    const { data: rows } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .in('role', ['user', 'assistant'])
      .not('content', 'is', null)
      .order('created_at', { ascending: true });

    const msgs = rows ?? [];
    const older = msgs.slice(0, Math.max(0, msgs.length - RECENT_KEEP));
    if (older.length < 6) return;

    const { data: session } = await supabase
      .from('chat_sessions')
      .select('summary')
      .eq('id', sessionId)
      .maybeSingle();

    const transcript = older
      .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
      .join('\n');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.3 },
    });

    const prompt = `You maintain a running summary of a user's conversation with a personal-finance assistant.
Update the summary so it captures the key questions asked and answers given in 3-5 sentences.
Keep concrete numbers, categories and date ranges the user cared about. No commentary, no preamble.

Existing summary:
${session?.summary?.trim() || '(none yet)'}

Older messages to fold in:
${transcript}

Return only the updated summary text.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();
    if (!summary) return;

    await supabase.from('chat_sessions').update({ summary }).eq('id', sessionId);
  } catch (err) {
    console.error('[finance-chat] summary update failed', err);
  }
}
