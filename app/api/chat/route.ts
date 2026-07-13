import { NextResponse, after } from 'next/server';
import type { Content } from '@google/generative-ai';

import { createClient } from '@/lib/supabase/server';
import { runFinanceChat, maybeSummarizeSession } from '@/lib/services/finance-chat';

const MAX_MESSAGE_CHARS = 2000;
const RATE_LIMIT = 30; // user messages per minute (§11)
const HISTORY_LIMIT = 20;

function sse(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { sessionId?: string | null; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = (body.message ?? '').trim();
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: `Message exceeds ${MAX_MESSAGE_CHARS} characters` },
      { status: 400 }
    );
  }

  // Rate limit: count this user's messages in the last minute (§11).
  // ponytail: single COUNT query per request; swap for a token bucket / Redis if traffic grows.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from('chat_messages')
    .select('id, chat_sessions!inner(user_id)', { count: 'exact', head: true })
    .eq('chat_sessions.user_id', user.id)
    .eq('role', 'user')
    .gte('created_at', since);
  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json({ error: 'Too many messages, slow down.' }, { status: 429 });
  }

  // Resolve the session (create if new, verify ownership otherwise).
  let sessionId = body.sessionId ?? null;
  let summary: string | null = null;
  if (sessionId) {
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id, summary')
      .eq('id', sessionId)
      .maybeSingle();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 403 });
    }
    summary = session.summary;
  } else {
    const { data: created, error: createErr } = await supabase
      .from('chat_sessions')
      // Seed the title from the first message; a nicer LLM title is a later upgrade.
      .insert({ user_id: user.id, title: message.slice(0, 60) })
      .select('id')
      .single();
    if (createErr || !created) {
      return NextResponse.json({ error: 'Could not create session' }, { status: 500 });
    }
    sessionId = created.id;
  }

  // Build Gemini history from the most recent user/assistant turns (tool rows are
  // skipped; the assistant's final text already captures each answer). Older turns
  // that scroll out of this window are carried by the rolling summary (§9).
  const { data: priorRows } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .in('role', ['user', 'assistant'])
    .not('content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  const history: Content[] = (priorRows ?? [])
    .reverse()
    .map((r) => ({
      role: r.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: r.content as string }],
    }));

  // Persist the incoming user message (§8 step 5).
  await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role: 'user', content: message });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: string, data: unknown) => controller.enqueue(sse(event, data));
      try {
        emit('session', { sessionId });

        const { text } = await runFinanceChat({
          supabase,
          userId: user.id,
          message,
          history,
          summary,
          onToken: (t) => emit('token', t),
          onToolCall: async (call) => {
            emit('tool', { name: call.name, args: call.args });
            await supabase.from('chat_messages').insert({
              session_id: sessionId,
              role: 'tool',
              tool_name: call.name,
              tool_calls: call.args,
              tool_result: call.result,
            });
          },
        });

        const { data: assistantRow } = await supabase
          .from('chat_messages')
          .insert({ session_id: sessionId, role: 'assistant', content: text })
          .select('id')
          .single();

        await supabase
          .from('chat_sessions')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', sessionId);

        emit('done', { messageId: assistantRow?.id });

        // Refresh the rolling summary after the response is sent, not in the hot path (§9).
        const sid = sessionId;
        if (sid) after(() => maybeSummarizeSession(supabase, sid));
      } catch (err) {
        console.error('[api/chat] stream error', err);
        emit('error', { message: 'Something went wrong generating a reply.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
