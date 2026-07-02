"use client";

import { useState, useRef, useEffect } from "react";
import { playfair } from "@/lib/fonts";

type Message = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

const SUGGESTIONS = [
  "What are the best campsites in the Sahara?",
  "Best camping spots near Kabylie?",
  "What gear do I need for desert camping?",
  "Cheap campsites under 2000 DZD/night?",
  "What is the best season to camp in Algeria?",
  "أنصحني بأفضل أماكن التخييم في الجزائر",
];

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i}>{part.slice(1, -1)}</em>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings: ### or ## or #
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizeClass = level === 1 ? "text-base" : level === 2 ? "text-sm" : "text-sm";
      elements.push(
        <p key={i} className={`${sizeClass} font-semibold mt-2 mb-0.5`}>
          <InlineText text={headingMatch[2]} />
        </p>
      );
      i++;
      continue;
    }

    // Bullet: * or - or •
    if (/^[\*\-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\*\-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\*\-•]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-none flex flex-col gap-0.5 my-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-1.5">
              <span className="mt-1 shrink-0 w-1 h-1 rounded-full" style={{ background: "var(--accent)", marginTop: "7px" }} />
              <span><InlineText text={item} /></span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-2 opacity-20" />);
      i++;
      continue;
    }

    // Empty line → spacing
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="leading-relaxed">
        <InlineText text={line} />
      </p>
    );
    i++;
  }

  return <div className="flex flex-col gap-0.5">{elements}</div>;
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{
            background: "var(--text-faint)",
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.9s",
          }}
        />
      ))}
    </span>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    // Placeholder for streaming AI response
    const assistantIdx = nextMessages.length;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", streaming: true },
    ]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(errText);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snapshot = accumulated;
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === assistantIdx
              ? { ...m, content: snapshot, streaming: true }
              : m
          )
        );
      }

      setMessages((prev) =>
        prev.map((m, idx) =>
          idx === assistantIdx ? { ...m, streaming: false } : m
        )
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === assistantIdx
              ? { ...m, content: "Sorry, something went wrong. Please try again.", streaming: false }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 44px - 64px)", background: "var(--bg-base)" }}
    >
      {/* ── Header ── */}
      <div
        className="shrink-0 px-6 md:px-16 py-4 border-b flex items-center gap-3"
        style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--accent)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 2a1 1 0 0 1 .894.553l2.618 5.302 5.85.85a1 1 0 0 1 .555 1.705l-4.233 4.126.999 5.823a1 1 0 0 1-1.45 1.054L12 18.9l-5.233 2.513a1 1 0 0 1-1.45-1.054l.999-5.823L2.083 10.41a1 1 0 0 1 .555-1.705l5.85-.85 2.618-5.302A1 1 0 0 1 12 2z" />
          </svg>
        </div>
        <div>
          <p
            className={`${playfair.className} text-base font-semibold leading-none`}
            style={{ color: "var(--text-primary)" }}
          >
            SahaTour AI
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            Your Algeria camping assistant
          </p>
        </div>
        <div
          className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          Online
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-16 py-6 flex flex-col gap-4">
        {isEmpty ? (
          /* Welcome state */
          <div className="flex flex-col items-center gap-8 my-auto">
            <div className="flex flex-col items-center gap-3 text-center max-w-md">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--accent-subtle)" }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--accent)" }}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2
                className={`${playfair.className} text-2xl font-bold`}
                style={{ color: "var(--text-primary)" }}
              >
                Ask me anything about camping
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                I know all the campsites on SahaTour and can help you plan the
                perfect trip across Algeria.
              </p>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="text-sm px-3 py-2 rounded-xl border transition text-left"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "var(--accent)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2a1 1 0 0 1 .894.553l2.618 5.302 5.85.85a1 1 0 0 1 .555 1.705l-4.233 4.126.999 5.823a1 1 0 0 1-1.45 1.054L12 18.9l-5.233 2.513a1 1 0 0 1-1.45-1.054l.999-5.823L2.083 10.41a1 1 0 0 1 .555-1.705l5.85-.85 2.618-5.302A1 1 0 0 1 12 2z" />
                  </svg>
                </div>
              )}

              {/* Bubble */}
              <div
                className="max-w-[80%] md:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        background: "var(--accent)",
                        color: "white",
                        borderBottomRightRadius: "4px",
                      }
                    : {
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        borderBottomLeftRadius: "4px",
                      }
                }
              >
                {msg.streaming && msg.content === "" ? (
                  <ThinkingDots />
                ) : (
                  <>
                    <MarkdownText text={msg.content} />
                    {msg.streaming && (
                      <span
                        className="inline-block w-0.5 h-3.5 ml-0.5 animate-pulse rounded-full align-middle"
                        style={{ background: "var(--text-faint)" }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ── */}
      <div
        className="shrink-0 px-4 md:px-16 py-3 border-t"
        style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl border px-4 py-2 transition-all"
          style={{
            background: "var(--bg-base)",
            borderColor: "var(--border)",
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about camping in Algeria..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm resize-none outline-none py-1 disabled:opacity-50"
            style={{
              color: "var(--text-primary)",
              minHeight: "24px",
              maxHeight: "120px",
            }}
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{
              background: input.trim() && !loading ? "var(--accent)" : "var(--bg-hover)",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] mt-1.5" style={{ color: "var(--text-ghost)" }}>
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
