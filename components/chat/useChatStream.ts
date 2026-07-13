'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { parseSSE } from '@/lib/chat/sseClient';

export type UIMessage = {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content?: string;
  toolName?: string;
  streaming?: boolean;
};

type ServerMessage = {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string | null;
  tool_name: string | null;
};

function rowToUI(r: ServerMessage): UIMessage | null {
  if (r.role === 'tool') return { id: r.id, role: 'tool', toolName: r.tool_name ?? 'tool' };
  if (r.role === 'user' || r.role === 'assistant') {
    return { id: r.id, role: r.role, content: r.content ?? '' };
  }
  return null; // skip 'system'
}

/**
 * Owns the chat panel's messages for the active session and the send loop.
 * Streams tokens into the latest assistant bubble and invalidates the session
 * list when a turn completes. Handles new-session creation via the `onSession`
 * callback fired from the server's first SSE event.
 */
export function useChatStream(sessionId: string | null, onSession: (id: string) => void) {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A session id we just created ourselves — don't reload its (empty) history over our stream.
  const skipLoadRef = useRef<string | null>(null);

  useEffect(() => {
    setError(null);
    if (!sessionId) {
      setMessages([]);
      return;
    }
    if (sessionId === skipLoadRef.current) {
      skipLoadRef.current = null;
      return;
    }
    let cancelled = false;
    fetch(`/api/chat/sessions/${sessionId}/messages`)
      .then((r) => r.json())
      .then(({ messages: rows }: { messages: ServerMessage[] }) => {
        if (cancelled) return;
        setMessages((rows ?? []).map(rowToUI).filter(Boolean) as UIMessage[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setIsStreaming(true);
      setError(null);
      const assistantId = crypto.randomUUID();
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: 'user', content: trimmed },
        { id: assistantId, role: 'assistant', content: '', streaming: true },
      ]);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message: trimmed }),
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || 'Request failed');
        }

        for await (const ev of parseSSE(res)) {
          if (ev.event === 'session') {
            const { sessionId: sid } = JSON.parse(ev.data);
            if (sid !== sessionId) {
              skipLoadRef.current = sid;
              onSession(sid);
            }
          } else if (ev.event === 'token') {
            const token = JSON.parse(ev.data) as string;
            setMessages((m) =>
              m.map((x) => (x.id === assistantId ? { ...x, content: (x.content ?? '') + token } : x))
            );
          } else if (ev.event === 'tool') {
            const { name } = JSON.parse(ev.data);
            setMessages((m) => {
              const i = m.findIndex((x) => x.id === assistantId);
              const chip: UIMessage = { id: crypto.randomUUID(), role: 'tool', toolName: name };
              return [...m.slice(0, i), chip, ...m.slice(i)];
            });
          } else if (ev.event === 'done') {
            setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, streaming: false } : x)));
            qc.invalidateQueries({ queryKey: ['chat-sessions'] });
          } else if (ev.event === 'error') {
            setError(JSON.parse(ev.data).message ?? 'Something went wrong');
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setMessages((m) => m.map((x) => (x.streaming ? { ...x, streaming: false } : x)));
        setIsStreaming(false);
      }
    },
    [sessionId, isStreaming, onSession, qc]
  );

  return { messages, isStreaming, error, send };
}
