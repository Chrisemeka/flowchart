'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';

type Session = { id: string; title: string; last_message_at: string };

async function fetchSessions(): Promise<Session[]> {
  const res = await fetch('/api/chat/sessions');
  if (!res.ok) throw new Error('Could not load sessions');
  return (await res.json()).sessions ?? [];
}

export default function SessionList({
  activeSessionId,
  onSelect,
}: {
  activeSessionId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const qc = useQueryClient();
  const { data: sessions = [] } = useQuery({ queryKey: ['chat-sessions'], queryFn: fetchSessions });

  const rename = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch(`/api/chat/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Rename failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-sessions'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: (_d, id) => {
      if (id === activeSessionId) onSelect(null);
      qc.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={() => onSelect(null)}
        className="m-3 inline-flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <Plus size={16} /> New chat
      </button>

      <ul className="flex-1 overflow-y-auto px-2 space-y-1">
        {sessions.map((s) => (
          <li key={s.id}>
            <div
              onClick={() => onSelect(s.id)}
              className={`group flex items-center gap-1 rounded-lg px-3 py-2 text-sm cursor-pointer ${
                s.id === activeSessionId ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
              }`}
            >
              <span className="flex-1 truncate">{s.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const title = window.prompt('Rename chat', s.title)?.trim();
                  if (title) rename.mutate({ id: s.id, title });
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1"
                title="Rename"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this chat?')) remove.mutate(s.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-1"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
        {sessions.length === 0 && (
          <li className="px-3 py-2 text-xs text-muted-foreground">No chats yet.</li>
        )}
      </ul>
    </div>
  );
}
