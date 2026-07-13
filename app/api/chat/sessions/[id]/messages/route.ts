import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/chat/sessions/[id]/messages — full message log for a session.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Confirm the session is the user's (RLS returns nothing otherwise) for a clean 404.
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, tool_name, tool_calls, tool_result, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[api/chat/sessions/[id]/messages] load error', error);
    return NextResponse.json({ error: 'Could not load messages' }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}
