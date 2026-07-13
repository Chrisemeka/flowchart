'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Menu, Upload } from 'lucide-react';

import { getUserStatements } from '@/app/actions/statement-actions';
import SessionList from './SessionList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChatStream } from './useChatStream';

export default function ChatShell() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { messages, isStreaming, error, send } = useChatStream(sessionId, setSessionId);

  const { data: statements, isLoading } = useQuery({
    queryKey: ['statements'],
    queryFn: async () => {
      const r = await getUserStatements();
      if (r.error) throw new Error(r.error);
      return r.data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Empty state (§10): no statements → nudge to upload instead of showing chat.
  if ((statements?.length ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg bg-muted/10 text-center">
        <span className="p-3 bg-primary/10 rounded-full text-primary mb-4">
          <Upload size={24} />
        </span>
        <p className="text-lg font-medium text-foreground">Upload a statement first</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          I can only answer questions once you have some transactions.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Upload size={16} /> Upload a statement
        </Link>
      </div>
    );
  }

  const select = (id: string | null) => {
    setSessionId(id);
    setDrawerOpen(false);
  };

  const title = messages.find((m) => m.role === 'user')?.content ?? 'New chat';

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[480px] rounded-lg border border-border overflow-hidden bg-background">
      <aside className="hidden md:flex w-[280px] shrink-0 border-r border-border flex-col">
        <SessionList activeSessionId={sessionId} onSelect={select} />
      </aside>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-[280px] bg-background border-r border-border flex flex-col">
            <SessionList activeSessionId={sessionId} onSelect={select} />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      <section className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <button className="md:hidden text-muted-foreground" onClick={() => setDrawerOpen(true)} title="Chats">
            <Menu size={18} />
          </button>
          <h2 className="text-sm font-medium text-foreground truncate">{title}</h2>
        </header>

        <MessageList messages={messages} isStreaming={isStreaming} error={error} />
        <MessageInput onSend={send} disabled={isStreaming} />
      </section>
    </div>
  );
}
