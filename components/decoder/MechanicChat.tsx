import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { runTool } from '../../utils/ai';
import type { Diagnosis } from '../../utils/diagnosis';
import { Panel, PanelTitle, focusRing, inputClass } from '../tool/kit';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const SUGGESTIONS = ['Can I fix this myself?', 'What should I ask the shop?', 'Is it safe for a long trip?'];
const MAX_TURNS = 16; // the server accepts up to 16

/** Renders the model's light markdown: paragraphs, "-" / "*" bullets and **bold**. */
function Formatted({ text }: { text: string }) {
  const bold = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <React.Fragment key={i}>{part}</React.Fragment>,
    );
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{bold(l.replace(/^\s*([-*•]|\d+\.)\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{bold(block.replace(/^#+\s*/gm, ''))}</p>;
      })}
    </div>
  );
}

export default function MechanicChat({ codes, vehicle, diagnosis }: { codes: string[]; vehicle: string; diagnosis: Diagnosis | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // A new lookup starts a new conversation.
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [codes.join(), vehicle]);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, sending]);

  // The chat's instructions are written on the server (api/_aiTools.ts, "mechanic-chat");
  // the page only sends the codes, the vehicle, a summary of the diagnosis and the conversation.
  const diagnosisSummary = diagnosis
    ? {
        codes: diagnosis.codes.map((c) => ({ code: c.code, title: c.title.slice(0, 120), drive: c.drive })),
        causes: diagnosis.causes.slice(0, 4).map((c) => ({ cause: c.cause.slice(0, 160), likelihood: c.likelihood })),
      }
    : undefined;

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || sending) return;
    const next = [...messages, { role: 'user' as const, text: q }];
    setMessages(next);
    setInput('');
    setSending(true);
    setError(null);
    try {
      const history = next.slice(-MAX_TURNS).map((m) => ({ role: m.role, text: m.role === 'user' ? m.text.slice(0, 600) : m.text.slice(0, 2000) }));
      // A history must start with the owner's message.
      while (history.length && history[0].role !== 'user') history.shift();
      const response = await runTool('mechanic-chat', { codes, vehicle, diagnosis: diagnosisSummary, messages: history });
      if (!response.text) throw new Error('No answer');
      setMessages([...next, { role: 'model', text: response.text }]);
    } catch (err) {
      setError(err instanceof Error && err.message !== 'No answer' ? err.message : "The mechanic couldn't answer just now. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel aria-labelledby="chat-title">
      <PanelTitle className="mb-1">
        <span id="chat-title">Ask the AI mechanic</span>
      </PanelTitle>
      <p className="text-[0.9375rem] text-muted-foreground">
        It knows your {codes.length > 1 ? 'codes' : 'code'}
        {vehicle ? ` and your ${vehicle}` : ''}, and remembers the conversation.
      </p>

      {messages.length > 0 && (
        <div className="mt-5 max-h-[28rem] space-y-4 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-4 py-3 text-[0.9375rem] leading-relaxed',
                  m.role === 'user' ? 'bg-sign-green text-white' : 'bg-muted text-foreground',
                )}
              >
                {m.role === 'model' ? <Formatted text={m.text} /> : m.text}
              </div>
            </div>
          ))}
          {sending && <p className="text-[0.9375rem] text-muted-foreground">The mechanic is typing…</p>}
          <div ref={endRef} />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-[0.9375rem] font-semibold text-sign-red">
          {error}
        </p>
      )}

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className={cn('cursor-pointer rounded-full border border-input px-3.5 py-1.5 text-[0.9375rem] hover:bg-muted', focusRing)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Your question
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about causes, costs or repairs"
          maxLength={600}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send question"
          className={cn(
            'inline-flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-sign-green text-white hover:bg-sign-green-strong disabled:cursor-not-allowed disabled:opacity-50',
            focusRing,
          )}
        >
          <Send className="size-5" />
        </button>
      </form>
    </Panel>
  );
}
