# Ask Your Finances — Chatbot Spec

Implementation spec for the "Ask your finances" feature. Written so Claude Code can build it end-to-end without further clarification. Read this whole doc before writing code.

## 1. Goal

Add a chatbot to the Flowchart dashboard where a user can ask natural-language questions about their uploaded bank statements — e.g. *"how much did I spend on transport last month?"*, *"which bank did I use most in June?"*, *"show me my top 5 merchants this year"* — and get accurate, grounded answers.

The chatbot must:

- Answer from the user's real transaction data in Supabase, not from the LLM's prior.
- Reason across every statement the user has uploaded, across every bank.
- Support multiple chat sessions per user. Each session remembers what has been discussed in it.
- Never leak one user's data to another user.

## 2. Architecture: tool-calling (no RAG in v1)

We are **not** using vector embeddings or semantic search in v1. Personal transaction data is structured and numeric; SQL aggregations are the right tool. If we later want fuzzy merchant search, we will add pgvector as a v2 optional extension.

The pattern is Gemini function-calling:

1. Client sends `{ sessionId, message }` to `/api/chat`.
2. Server loads recent messages from `chat_messages` for that session.
3. Server calls Gemini with: system prompt + chat history + new message + a declared list of tool schemas.
4. Gemini either (a) responds directly, or (b) emits one or more function-call requests.
5. For each function call, the server runs the matching TypeScript function against Supabase (scoped to the logged-in user) and hands the JSON result back to Gemini.
6. Loop until Gemini stops requesting tools; then stream the final natural-language answer to the client.
7. Persist the user message and the assistant's final message (plus tool calls/results) into `chat_messages`.

**Gemini never touches the database directly.** All DB access happens in whitelisted TypeScript functions. All queries are scoped by `user_id` in server code, never by the model.

## 3. Existing project context

- Framework: Next.js 16 (App Router) + React 19.
- DB/auth: Supabase (`@supabase/ssr`, `@supabase/supabase-js`).
- LLM: Gemini via `@google/generative-ai` (already installed, key in `GEMINI_API_KEY`).
- Data fetching: TanStack Query.
- Existing dashboard routes: `app/dashboard/{compare,history}/`, layout at `app/dashboard/layout.tsx`.
- Existing Supabase clients: `lib/supabase/{client,server,middleware}.ts`.
- Categories are a fixed list in `lib/constants.ts` (`TRANSACTION_CATEGORIES`).

### Existing schema (do not modify)

`statements`
- `id uuid pk`
- `user_id uuid` (owner)
- `bank_name text`
- `account_number text`
- `month int`, `year int`
- `start_date timestamptz`, `end_date timestamptz`
- `file_name text`

`transactions`
- `id uuid pk`
- `statement_id uuid fk -> statements.id`
- `amount numeric`
- `type text` — `'Debit'` or `'Credit'`
- `date timestamptz`
- `narration text` (raw)
- `clean_name text` (parsed description)
- `category text` (one of `TRANSACTION_CATEGORIES` or `'Uncategorized'`)
- `hash text`

Note: `transactions` has NO direct `user_id`. Ownership is inherited via `statement_id -> statements.user_id`. Every tool query MUST join through `statements` and filter by `statements.user_id = auth.uid()`, either via RLS or explicit `.eq('user_id', user.id)` on the join.

## 4. New DB schema

> **Status: DONE.** Both tables, indexes, and RLS policies have already been created in Supabase via the SQL editor. The SQL below is kept as documentation only — do not re-run.

```sql
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  summary text,                            -- rolling summary of older turns
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index chat_sessions_user_recent_idx
  on chat_sessions (user_id, last_message_at desc);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool','system')),
  content text,                            -- user text or assistant final text
  tool_calls jsonb,                        -- when role='assistant' emits calls
  tool_name text,                          -- when role='tool'
  tool_result jsonb,                       -- when role='tool'
  created_at timestamptz not null default now()
);

create index chat_messages_session_idx
  on chat_messages (session_id, created_at asc);

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

create policy "own sessions"
  on chat_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own messages"
  on chat_messages for all
  using (exists (
    select 1 from chat_sessions s
    where s.id = chat_messages.session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from chat_sessions s
    where s.id = chat_messages.session_id and s.user_id = auth.uid()
  ));
```

No migration file needed — the schema was applied directly in the Supabase SQL editor.

## 5. Tool menu

Create `lib/services/finance-tools.ts`. Each function is a pure TypeScript function that (a) takes a typed args object, (b) queries Supabase scoped to the current user, (c) returns a JSON-serialisable result. All are called only from the server (`/api/chat`).

Signatures below use TypeScript for clarity. Every function receives a `SupabaseClient` and the `userId` (never trust the model to supply the user id).

```ts
type DateRange = { startDate: string; endDate: string }; // ISO YYYY-MM-DD

listBanks(supabase, userId): Promise<{ banks: string[] }>
listCategories(supabase, userId): Promise<{ categories: string[] }>
listStatementPeriods(supabase, userId): Promise<{
  periods: { bank: string; month: number; year: number;
             startDate: string; endDate: string }[]
}>

getSpendingByCategory(supabase, userId, {
  category: string, ...DateRange, bank?: string
}): Promise<{ total: number; count: number; currency: 'NGN' }>

getSpendingBreakdown(supabase, userId, {
  ...DateRange, bank?: string
}): Promise<{
  byCategory: { category: string; total: number; count: number }[];
  totalDebits: number; totalCredits: number;
}>

getIncomeVsExpense(supabase, userId, {
  ...DateRange, bank?: string
}): Promise<{ income: number; expense: number; net: number }>

getTopMerchants(supabase, userId, {
  ...DateRange, limit?: number, bank?: string
}): Promise<{ merchants: { name: string; total: number; count: number }[] }>

getTransactions(supabase, userId, {
  ...DateRange, category?: string, minAmount?: number, maxAmount?: number,
  search?: string,      // matches clean_name / narration ilike
  type?: 'Debit'|'Credit',
  bank?: string,
  limit?: number        // default 50, hard cap 200
}): Promise<{ transactions: Array<{
  id: string; date: string; amount: number; type: 'Debit'|'Credit';
  category: string; description: string; bank: string;
}> }>

compareRanges(supabase, userId, {
  rangeA: DateRange; rangeB: DateRange;
  groupBy?: 'category' | 'bank' | 'total';
}): Promise<{
  a: { total: number; groups?: Record<string, number> };
  b: { total: number; groups?: Record<string, number> };
  delta: { total: number; groups?: Record<string, number> };
}>

getBalanceOverTime(supabase, userId, {
  ...DateRange, granularity: 'day'|'week'|'month', bank?: string
}): Promise<{ points: { period: string; income: number; expense: number; net: number }[] }>
```

**Cross-statement / cross-bank reasoning falls out automatically** because every query joins `transactions` -> `statements` and filters only by `user_id` and date range — never by `statement_id`. If the user has three banks and eight statements, all rows are visible.

**Aggregation strategy.** All aggregation tools run their `SUM` / `GROUP BY` inside Postgres via RPCs (see §5a). This avoids Supabase's default 1000-row response cap — a JS-side aggregation over 1500 transactions would silently under-count with no error. It also cuts data transfer from thousands of rows to a handful of summary rows. JS aggregation is used only in `getTransactions`, which is a bounded row list, and in `compareRanges`, which composes two RPC calls.

**Hard caps** in each function (server-side, non-negotiable):
- `getTransactions.limit` capped at 200.
- Response JSON handed back to Gemini kept under ~30KB per tool call. Truncate and mark `truncated: true` if exceeded.
- All amounts returned as numbers, NOT strings. Currency assumed NGN for v1.

## 5a. Postgres RPCs

The following Supabase functions back the aggregation tools. Each is declared `security invoker` so RLS on `transactions` / `statements` still applies, and `stable` so the planner can cache within a request. Every RPC takes `p_user_id` as its first argument, filtered explicitly in the SQL — belt-and-suspenders with RLS. The API route always passes `auth.uid()`, never a client- or model-supplied id.

| RPC | Called by tool | Returns |
|---|---|---|
| `list_categories(p_user_id)` | `listCategories` | rows of distinct categories |
| `get_spending_by_category(p_user_id, p_category, p_start_date, p_end_date, p_bank)` | `getSpendingByCategory` | `(total, count)` |
| `get_spending_breakdown(p_user_id, p_start_date, p_end_date, p_bank)` | `getSpendingBreakdown` | per-category debit/credit totals |
| `get_income_vs_expense(p_user_id, p_start_date, p_end_date, p_bank)` | `getIncomeVsExpense` | `(income, expense)` |
| `get_top_merchants(p_user_id, p_start_date, p_end_date, p_limit, p_bank)` | `getTopMerchants` | top N merchants by spend |
| `get_balance_over_time(p_user_id, p_start_date, p_end_date, p_granularity, p_bank)` | `getBalanceOverTime` | `(period, income, expense, net)` per bucket |

Full SQL for each RPC lives alongside the initial chat-tables migration (applied via the Supabase SQL editor, no migration file). TS wrappers in `finance-tools.ts` reduce to a `supabase.rpc('...', {...})` call plus a small remap into the tool's return shape.

## 6. Gemini wiring

Extend `lib/services/gemini.ts` with a `runFinanceChat` function, or create `lib/services/finance-chat.ts` (preferred, keeps categorisation separate).

Model: `gemini-2.5-flash` (already used by the codebase). Use function-calling:

```ts
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: SYSTEM_PROMPT,      // see §7
  tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
  generationConfig: { temperature: 0.2 },
});

const chat = model.startChat({ history: geminiHistory });
```

`TOOL_DECLARATIONS` mirrors the tool menu in §5. Each declaration must include a rich `description` for both the function and every parameter — this is how Gemini decides which one to call. Use `enum` for `category` (populate from `TRANSACTION_CATEGORIES`) and for `bank` if convenient (populate at request time from `listBanks`).

Function-call loop pseudo-code:

```ts
let result = await chat.sendMessage(userMessage);
while (true) {
  const calls = result.response.functionCalls();
  if (!calls?.length) break;
  const responses = await Promise.all(calls.map(async (call) => {
    const fn = TOOL_REGISTRY[call.name];
    if (!fn) return { name: call.name, response: { error: 'unknown tool' } };
    const out = await fn(supabase, userId, call.args);
    return { name: call.name, response: out };
  }));
  // Persist tool calls + results to chat_messages before sending back
  result = await chat.sendMessage(responses.map(r => ({
    functionResponse: { name: r.name, response: r.response }
  })));
}
const finalText = result.response.text();
```

Cap the loop at 6 iterations to defend against infinite tool-calling.

## 7. System prompt

Compose at request time. Put in `lib/services/finance-chat-prompt.ts`.

```
You are the "Ask your finances" assistant inside Flowchart, a Nigerian personal-finance app.

- Today is {{today ISO}}. The user's currency is NGN (₦). Format money as ₦12,345.67.
- The user has uploaded one or more bank statements. You can call tools to query
  their transaction data. Never invent numbers — if you don't have data, call a tool
  or ask the user.
- When the user gives a relative date ("last month", "this year", "past 30 days"),
  resolve it against today's date before calling a tool.
- Available banks for this user: {{banks joined}}.
- Available categories: {{TRANSACTION_CATEGORIES joined}}.
- Prefer `getSpendingBreakdown` when the user asks about several categories at once.
- Prefer `getTopMerchants` for "where did my money go" style questions.
- Prefer `getTransactions` (with `search`) when the user names a specific merchant.
- If the user asks a comparison ("June vs May", "this year vs last"), use
  `compareRanges` with the correct groupBy.
- Keep answers concise. Show the number first, then a one-line explanation.
  Include a small breakdown only when it adds value.
- If a tool result includes `truncated: true`, tell the user you only looked at
  the top N and offer to narrow the query.
- If the user asks about something outside their financial data (jokes, general
  knowledge, other apps), politely steer back.
```

## 8. API route

`app/api/chat/route.ts`. POST-only. Streaming.

### Request

```ts
POST /api/chat
{ sessionId: string | null,  // null => create new session
  message: string }
```

### Behaviour

1. Auth: `createClient()` from `lib/supabase/server`, `supabase.auth.getUser()`. 401 if no user.
2. If `sessionId` is null, insert a new `chat_sessions` row (`title: 'New chat'`) and use its id.
3. Otherwise verify the session belongs to the user (RLS covers this, but check explicitly for a nicer 403).
4. Load the last N (say 20) `chat_messages` for the session, plus `chat_sessions.summary`, and build Gemini history from them.
5. Insert the new user message row.
6. Run the function-call loop (§6). Persist assistant tool-calls and tool results to `chat_messages` as they happen.
7. Stream the final assistant text back to the client via SSE or `ReadableStream`. Persist the completed assistant message to `chat_messages` when the stream closes.
8. Update `chat_sessions.last_message_at = now()`.
9. If the session's title is still `'New chat'` after the assistant reply, kick off (do not block on) a background call to Gemini to generate a 3-6 word title from the first user turn and save it.

### Response

`text/event-stream` with events:

```
event: session   data: { "sessionId": "..." }
event: token     data: "How"
event: token     data: " much"
event: tool      data: { "name": "getSpendingByCategory", "args": {...} }
event: done      data: { "messageId": "..." }
```

Return 4xx/5xx JSON on error before the stream starts. Once streaming, use an `event: error` payload.

### Additional endpoints

- `GET  /api/chat/sessions` → list current user's sessions ordered by `last_message_at` desc.
- `GET  /api/chat/sessions/[id]/messages` → full message log for a session.
- `PATCH /api/chat/sessions/[id]` → rename (`{ title }`).
- `DELETE /api/chat/sessions/[id]` → cascade-deletes messages.

## 9. Rolling summary (long sessions)

To keep context small once a session has many turns:

- When persisted message count for a session exceeds 30, run a background call: summarise the oldest 15 messages into 3-5 sentences and store on `chat_sessions.summary`, then delete (or mark hidden) those 15 rows from history reconstruction. Keep them in DB for audit but skip them when building Gemini history.
- Always prepend the current `summary` as a leading `system`-style turn when building Gemini history.

Ship v1 without the summariser if it slows delivery; add behind a comment `// TODO: rolling summary` and keep the `summary` column unused.

## 10. UI

New route `app/dashboard/chat/page.tsx`. Add a nav entry in the dashboard layout labelled **Ask your finances** (Lucide icon: `MessagesSquare` or `Sparkles`).

Layout (desktop):

```
+-----------------------------+-------------------------------+
| Sessions (sidebar, 280px)   | Chat panel                    |
|                             |                               |
| [+ New chat]                | Header: session title (rename)|
| - Groceries in June         | ------------------------------|
| - Bank comparison           |  message stream               |
| - Uber spend                |  (user / assistant bubbles)   |
|                             |  tool chips: "checking...")   |
|                             | ------------------------------|
|                             | [ input box            ][send]|
+-----------------------------+-------------------------------+
```

Mobile: sidebar collapses into a top drawer.

### Components (`components/chat/`)

- `ChatShell.tsx` — top-level layout, holds the current `sessionId` state.
- `SessionList.tsx` — TanStack Query hook `useSessions()`; New chat button; rename + delete via a `…` menu.
- `MessageList.tsx` — renders messages; assistant messages support markdown (use `react-markdown` if easy, else plain `<pre>`); tool calls render as small collapsible chips ("Fetched 42 transactions").
- `MessageInput.tsx` — textarea + send button; disables while streaming.
- `useChatStream.ts` — hook that opens the SSE stream, appends tokens to the latest assistant bubble, and invalidates the sessions query when done.

### Streaming pattern

Consume the SSE stream with `fetch` + `ReadableStream` (no EventSource — we need to POST). Parse `event:` / `data:` lines yourself; keep the parser in `lib/chat/sseClient.ts`.

Show a "…thinking" indicator between the user turn and the first token. When a `tool` event arrives, show a chip like *"Checking your transactions…"* immediately above the message being composed.

### Empty state

If the user has zero statements uploaded, don't show the chat — show a card explaining "Upload a statement first" with a link to the upload page.

## 11. Security & guardrails

- Every tool query filters by `user_id` in the join, and RLS on `statements`/`transactions` is the second layer of defence. Add RLS on those tables if not already present.
- The model never sees `user_id`. It's not a parameter in any tool declaration.
- Rate limit `/api/chat` per user (e.g. 30 messages/minute) using an existing middleware pattern or a simple Supabase-based counter.
- Reject messages longer than 2000 chars.
- Cap Gemini tool-call loop at 6 iterations. If exceeded, respond with "I couldn't complete that, try being more specific."
- Cap tool result JSON size (~30KB) before handing to Gemini.
- Log tool-call name + args (not results) to console in dev, not prod.
- Do NOT include the raw Supabase error string in client responses.

## 12. Files to create / modify

New:
- ~~`lib/services/finance-tools.ts`~~ **DONE**
- `lib/services/finance-chat.ts`
- `lib/services/finance-chat-prompt.ts`
- `lib/chat/sseClient.ts`
- `app/api/chat/route.ts`
- `app/api/chat/sessions/route.ts`
- `app/api/chat/sessions/[id]/route.ts`
- `app/api/chat/sessions/[id]/messages/route.ts`
- `app/dashboard/chat/page.tsx`
- `components/chat/ChatShell.tsx`
- `components/chat/SessionList.tsx`
- `components/chat/MessageList.tsx`
- `components/chat/MessageInput.tsx`
- `components/chat/useChatStream.ts`
- Tests under `tests/` mirroring existing project convention.

Modify:
- `app/dashboard/layout.tsx` — add nav item.

Do not modify:
- Existing `lib/services/bank-statement.ts` or `lib/services/gemini.ts` beyond adding an export if truly needed. Categorisation logic stays intact.

## 13. Suggested build order

1. ~~Migration + RLS.~~ **Done** — `chat_sessions` and `chat_messages` tables plus RLS policies applied directly via the Supabase SQL editor.
2. ~~`finance-tools.ts`.~~ **Done** — all 10 tool functions implemented in `lib/services/finance-tools.ts`, backed by the six Postgres RPCs from §5a (applied via the SQL editor). `FINANCE_TOOLS` registry and `FinanceToolName` type exported. Known follow-up: `compareRanges` with `groupBy: 'bank'` still uses JS aggregation and can hit the 1000-row cap on heavy users — track as a v1.1 improvement (add a `get_spending_by_bank` RPC and route the branch through it). Recommended next: write `scripts/test-finance-tools.ts` (mirror `scripts/simple-test.ts`) to smoke-test each function against a real logged-in account before wiring Gemini.
3. `finance-chat.ts` + prompt + tool declarations. Write a non-streaming test that runs a full Q&A end-to-end.
4. `/api/chat` route with streaming.
5. Session CRUD endpoints.
6. UI shell, then session list, then message list, then streaming input.
7. Nav entry + empty state.
8. Rolling summary (optional v1.1).

## 14. Test cases to cover

Correctness:
- "How much did I spend on transport last month?" → one `getSpendingByCategory` call, correct total.
- "Compare my food spending in June vs May." → `compareRanges` with `groupBy: 'category'` OR two `getSpendingByCategory` calls; either is acceptable.
- "Show me my top 5 merchants this year." → `getTopMerchants` with `limit: 5`.
- "How much did I spend on Uber?" → `getTransactions` with `search: 'uber'`.
- Multi-bank user asking "which bank did I use most in June" → `getSpendingBreakdown` or a dedicated bank-breakdown; returns per-bank totals.
- Vague question with no date → assistant asks for a range OR defaults to last 30 days per prompt.

Isolation:
- User A cannot read user B's messages/sessions/transactions via any endpoint or tool.

Robustness:
- Tool loop capped at 6.
- Truncation flag surfaces to the user.
- Streaming survives a mid-stream tool call.

## 15. Env / config

- Reuse `GEMINI_API_KEY` (already set).
- No new env vars needed for v1.

---

Ship v1 with tool-calling only; leave pgvector for a future extension. Cross-statement reasoning is inherent because tools never filter by `statement_id`.
