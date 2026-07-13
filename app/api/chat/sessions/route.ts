import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/chat/sessions — the current user's sessions, most recent first.
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, created_at, last_message_at')
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('[api/chat/sessions] list error', error);
    return NextResponse.json({ error: 'Could not load sessions' }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}
