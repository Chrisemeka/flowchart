'use client';

import { useEffect, useRef } from 'react';
import { Wrench } from 'lucide-react';

import type { UIMessage } from './useChatStream';

// Human-friendly labels for the tool chips (§10: "Checking your transactions…").
const TOOL_LABELS: Record<string, string> = {
  listBanks: 'Checking your banks',
  listCategories: 'Checking your categories',
  listStatementPeriods: 'Checking your statements',
  getSpendingByCategory: 'Adding up that category',
  getSpendingBreakdown: 'Breaking down your spending',
  getIncomeVsExpense: 'Comparing income vs expense',
  getTopMerchants: 'Finding your top merchants',
  getTransactions: 'Looking through your transactions',
  compareRanges: 'Comparing those periods',
  getBalanceOverTime: 'Tracking your balance over time',
};

export default function MessageList({
  messages,
  isStreaming,
  error,
}: {
  messages: UIMessage[];
  isStreaming: boolean;
  error: string | null;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.length === 0 && !isStreaming && (
        <p className="text-center text-sm text-muted-foreground mt-8">
          Ask something like &ldquo;How much did I spend on transport last month?&rdquo;
        </p>
      )}

      {messages.map((m) => {
        if (m.role === 'tool') {
          return (
            <div key={m.id} className="flex justify-start">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border rounded-full px-2.5 py-1">
                <Wrench size={12} />
                {(m.toolName && TOOL_LABELS[m.toolName]) ?? 'Checking your data'}…
              </span>
            </div>
          );
        }

        const isUser = m.role === 'user';
        const showThinking = m.role === 'assistant' && !m.content && m.streaming;
        return (
          <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                isUser
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
            >
              {showThinking ? (
                <span className="inline-flex gap-1 text-muted-foreground">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce [animation-delay:0.15s]">•</span>
                  <span className="animate-bounce [animation-delay:0.3s]">•</span>
                </span>
              ) : (
                m.content
              )}
            </div>
          </div>
        );
      })}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}
      <div ref={endRef} />
    </div>
  );
}
