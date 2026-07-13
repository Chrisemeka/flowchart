import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/chat/sessions/[id] — rename a session.
export async function PATCH(request: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let body: { title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const title = (body.title ?? '').trim().slice(0, 100);
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // RLS scopes the update to the user's own sessions; empty result => not theirs.
  const { data, error } = await supabase
    .from('chat_sessions')
    .update({ title })
    .eq('id', id)
    .select('id, title')
    .maybeSingle();

  if (error) {
    console.error('[api/chat/sessions/[id]] rename error', error);
    return NextResponse.json({ error: 'Could not rename session' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ session: data });
}

// DELETE /api/chat/sessions/[id] — cascade-deletes its messages (FK on delete cascade).
export async function DELETE(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[api/chat/sessions/[id]] delete error', error);
    return NextResponse.json({ error: 'Could not delete session' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
