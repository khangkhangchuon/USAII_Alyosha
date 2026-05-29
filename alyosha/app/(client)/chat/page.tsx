"use client";
import { useRef, useState } from "react";

type Citation = { source_title: string; source_url: string };
type Msg = {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
};

export default function ClientChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    const history = messages.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setStreaming(true);
    // Placeholder assistant bubble we stream into.
    setMessages((m) => [...m, { role: "assistant", text: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      let citations: Citation[] = [];
      try {
        citations = JSON.parse(
          decodeURIComponent(res.headers.get("X-Citations") ?? "[]"),
        );
      } catch {
        /* ignore */
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = { role: "assistant", text: acc };
            return next;
          });
        }
      }
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", text: acc, citations };
        return next;
      });
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          text: "Something went wrong. Please try again, or ask your caseworker for help.",
        };
        return next;
      });
    } finally {
      setStreaming(false);
      listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-navy-900">Ask Alyosha</h1>
        <p className="rounded-md bg-surface-muted border border-navy-100 p-3 text-sm text-navy-700">
          Alyosha answers from verified NYC reentry guidance and shows its
          sources. For legal, medical, or crisis situations, it will point you to
          a real person who can help.
        </p>
      </section>

      <div className="flex-1 space-y-3" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-navy-500">
            Ask anything — like “How do I get my ID?” or “Where can I find a
            job?”
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block text-left max-w-[85%] rounded-lg px-4 py-3 whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-navy-700 text-surface"
                  : "bg-surface-muted border border-navy-100 text-navy-900"
              }`}
            >
              {m.text || (streaming ? "…" : "")}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-navy-100 flex flex-wrap gap-2">
                  {m.citations.map((c) => (
                    <a
                      key={c.source_url}
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded-full bg-navy-100 text-navy-700 underline"
                    >
                      📄 {c.source_title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={listEndRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 sticky bottom-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          aria-label="Type your question"
          className="flex-1 min-h-[44px] px-4 py-3 rounded-md border border-navy-200 bg-surface text-navy-900"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="min-h-[44px] px-5 rounded-md bg-accent-500 text-navy-900 font-semibold hover:bg-accent-600 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
