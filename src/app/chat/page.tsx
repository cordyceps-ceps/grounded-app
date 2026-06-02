"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n").filter(Boolean);

        for (const line of lines) {
          if (line === "data: [DONE]") continue;
          if (!line.startsWith("data: ")) continue;

          const json = line.slice(6);
          try {
            const parsed = JSON.parse(json);
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  last.content += parsed.text;
                }
                return updated;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          last.content = "Something went wrong. Please try again.";
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="px-5 pt-10 pb-4 text-center border-b border-card-border">
        <a href="/" className="inline-block">
          <h1 className="font-heading text-2xl text-primary tracking-tight">
            Grounded
          </h1>
        </a>
        <p className="text-muted text-xs mt-1">Breastfeeding Guide</p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">
              Ask anything about breastfeeding. Answers come from three
              expert-vetted books — not the internet.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-card border border-card-border rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="prose prose-sm max-w-none
                      prose-headings:font-heading prose-headings:text-foreground
                      prose-strong:text-foreground prose-em:text-secondary
                      prose-li:text-foreground prose-p:text-foreground"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdown(msg.content),
                    }}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}
                {msg.role === "assistant" &&
                  isStreaming &&
                  i === messages.length - 1 && (
                    <span className="inline-block w-1.5 h-4 bg-primary/50 animate-pulse ml-0.5 align-text-bottom" />
                  )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-card-border bg-background px-5 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex items-end gap-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            className="flex-1 resize-none bg-card border border-card-border rounded-xl px-4 py-3 text-sm
                       text-foreground placeholder:text-muted
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="shrink-0 bg-primary text-white rounded-xl px-5 py-3 text-sm font-medium
                       hover:bg-primary-hover active:scale-[0.97] transition-all duration-150
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isStreaming ? "..." : "Send"}
          </button>
        </form>
        <p className="text-center text-[10px] text-muted mt-2 max-w-2xl mx-auto">
          Grounded draws from expert books but is not a replacement for medical
          advice.
        </p>
      </div>
    </div>
  );
}

/** Simple markdown → HTML for bold, italic, lists, line breaks */
function formatMarkdown(text: string): string {
  if (!text) return "";

  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Numbered lists
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Bullet lists
    .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
    // Wrap consecutive <li> in <ol> or <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul class='list-disc pl-4 space-y-1'>$1</ul>")
    // Line breaks
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    // Wrap in paragraph
    .replace(/^(.+)$/, "<p>$1</p>");
}
