"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sun, Moon, Leaf, Mic, ArrowUp, Book, Copy, Pin, Phone, Play } from "lucide-react";
import { TopBar, Kicker, IconBtn } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/UserProvider";
import { getTopicById } from "@/lib/topics";

interface AnswerBlock {
  type: "lead" | "h" | "p" | "ol" | "ul" | "video" | "callout";
  text?: string;
  md?: string;
  items?: string[];
  title?: string;
  channel?: string;
  dur?: string;
  resource?: { name: string; tel: string };
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  pinned?: boolean;
}

interface BabyContext {
  name: string;
  gender: string | null;
  age: string;
  born: boolean;
}

function DarkToggle() {
  const { isDark, setMode, mode } = useTheme();
  return (
    <IconBtn
      icon={isDark ? Sun : Moon}
      label="Toggle night mode"
      onClick={() => {
        if (mode === "auto") setMode(isDark ? "light" : "night");
        else if (mode === "night") setMode("light");
        else setMode("night");
      }}
    />
  );
}

function mdInline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--g-prim);text-decoration:underline">$1</a>');
}

function AnswerBlockRenderer({ block }: { block: AnswerBlock }) {
  if (block.type === "h") {
    return (
      <div className="g-up font-display text-[25px] text-g-prim mt-[22px] mb-[2px] leading-[1.05]">
        {block.text}
      </div>
    );
  }

  if (block.type === "lead") {
    return (
      <p
        className="g-up font-body text-[15.5px] leading-[1.6] text-g-ink"
        dangerouslySetInnerHTML={{ __html: mdInline(block.md || "") }}
      />
    );
  }

  if (block.type === "p") {
    return (
      <p
        className="g-up font-body text-[15px] leading-[1.6] text-g-sub mt-[11px]"
        dangerouslySetInnerHTML={{ __html: mdInline(block.md || "") }}
      />
    );
  }

  if (block.type === "ol" && block.items) {
    return (
      <ol className="g-up list-none m-0 mt-[14px] p-0 flex flex-col gap-[11px]">
        {block.items.map((item, j) => (
          <li key={j} className="flex gap-[13px]">
            <span className="font-display text-[26px] text-g-honey leading-[0.9] shrink-0 w-[22px]">
              {j + 1}
            </span>
            <span
              className="font-body text-[15px] leading-[1.5] text-g-ink pt-[2px]"
              dangerouslySetInnerHTML={{ __html: mdInline(item) }}
            />
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "ul" && block.items) {
    return (
      <ul className="g-up list-none m-0 mt-[14px] p-0 flex flex-col gap-[9px]">
        {block.items.map((item, j) => (
          <li key={j} className="flex gap-[10px]">
            <span className="text-g-prim shrink-0 mt-[7px] w-[6px] h-[6px] rounded-full bg-g-prim" />
            <span
              className="font-body text-[15px] leading-[1.5] text-g-ink"
              dangerouslySetInnerHTML={{ __html: mdInline(item) }}
            />
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "video") {
    return (
      <div className="g-up mt-5 rounded-[18px] overflow-hidden bg-g-panel shadow-[var(--g-shadow)]">
        <div
          className="h-[110px] flex items-center justify-center"
          style={{
            background: `repeating-linear-gradient(135deg, var(--g-panel2), var(--g-panel2) 12px, var(--g-prim-soft) 12px, var(--g-prim-soft) 24px)`,
          }}
        >
          <span className="w-[52px] h-[52px] rounded-full bg-g-prim text-g-on-prim flex items-center justify-center shadow-[0_5px_14px_rgba(0,0,0,0.25)]">
            <Play size={22} />
          </span>
        </div>
        <div className="p-4">
          <Kicker color="var(--g-prim)" className="mb-[6px]">
            Here&rsquo;s what the book says — and a video showing you
          </Kicker>
          <div className="font-display text-[21px] text-g-ink leading-[1.05]">{block.title}</div>
          <div className="font-body text-[12.5px] text-g-faint mt-[5px]">
            {block.channel} · {block.dur}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="g-up mt-5 bg-g-honey-soft rounded-[18px] p-[17px]">
        <div className="font-body text-[14.5px] leading-[1.5] text-g-ink mb-[13px]">{block.text}</div>
        {block.resource && (
          <a className="flex items-center gap-[11px] no-underline" href={`tel:${block.resource.tel}`}>
            <span className="w-[42px] h-[42px] rounded-full bg-g-honey text-g-on-prim flex items-center justify-center shrink-0">
              <Phone size={18} />
            </span>
            <span>
              <span className="block font-body text-[14px] font-bold text-g-ink">{block.resource.name}</span>
              <span className="block font-body text-[13px] text-g-sub">{block.resource.tel}</span>
            </span>
          </a>
        )}
      </div>
    );
  }

  return null;
}

const FALLBACK_SUGGESTIONS = [
  "Is cluster feeding normal in the evenings?",
  "How do I know she\u2019s getting enough milk?",
  "How do I get a deeper, comfier latch?",
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [leadText, setLeadText] = useState("");
  const [blocks, setBlocks] = useState<AnswerBlock[]>([]);
  const [done, setDone] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [topicId, setTopicId] = useState("bf");
  const [convoId, setConvoId] = useState<string | null>(isNew ? null : (params.id as string));
  const [convoLoaded, setConvoLoaded] = useState(isNew);

  const { me, familyId, baby: userBaby, facts: allFacts, suggestions, loaded: userLoaded, refreshConvos, refreshPins, refreshSuggestions } = useUser();
  const baby: BabyContext | null = userBaby
    ? { name: userBaby.name, gender: userBaby.gender, born: userBaby.born, age: userBaby.age || "" }
    : null;

  // Load existing conversation only
  useEffect(() => {
    if (isNew || !params.id) return;
    const load = async () => {
      const supabase = createClient();
      const { data: convo } = await supabase
        .from("conversations")
        .select("id, topic_id")
        .eq("id", params.id)
        .single();

      if (convo) {
        setTopicId(convo.topic_id);
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, role, content, pinned")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: true });

        if (msgs && msgs.length > 0) {
          setMessages(msgs as Message[]);
          const lastAssistant = msgs.filter((m: Message) => m.role === "assistant").pop();
          if (lastAssistant) {
            setBlocks(parseAnswer(lastAssistant.content));
            setSources(extractSources(lastAssistant.content));
            setDone(true);
          }
        }
      }
      setConvoLoaded(true);
    };
    load();
  }, [isNew, params.id]);

  const loaded = userLoaded && convoLoaded;

  // Resolve suggested questions: use cached if fresh, else trigger generation
  const cached = suggestions[topicId];
  const STALE_MS = 24 * 60 * 60 * 1000;
  const isCacheStale = !cached || (Date.now() - new Date(cached.created_at).getTime() > STALE_MS);
  const suggested = cached?.questions?.length ? cached.questions : FALLBACK_SUGGESTIONS;

  useEffect(() => {
    if (loaded && isNew && isCacheStale && familyId) {
      refreshSuggestions(topicId);
    }
  }, [loaded, isNew, topicId]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = useCallback(() => {
    const s = scrollRef.current;
    if (s) s.scrollTop = s.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [leadText, blocks, messages, scrollToBottom]);

  const sendQuestion = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || !familyId) return;

      const newMessages: Message[] = [...messages, { role: "user", content: q }];
      setMessages(newMessages);
      setInput("");
      setStreaming(true);
      setLeadText("");
      setBlocks([]);
      setDone(false);
      setSources([]);

      const supabase = createClient();

      // Create conversation if new
      let currentConvoId = convoId;
      if (!currentConvoId) {
        const id = crypto.randomUUID();
        const { error } = await supabase
          .from("conversations")
          .insert({
            id,
            family_id: familyId,
            topic_id: topicId,
            title: q.length > 120 ? q.slice(0, 117) + "..." : q,
          });

        if (error) {
          console.error("Failed to create conversation:", error);
        } else {
          currentConvoId = id;
          setConvoId(id);
          // Update URL without navigation
          window.history.replaceState(null, "", `/chat/${id}`);
        }
      }

      // Save user message
      if (currentConvoId) {
        await supabase.from("messages").insert({
          conversation_id: currentConvoId,
          role: "user",
          content: q,
        });
      }

      try {
        const topicFacts = allFacts
          .filter((f) => f.topic_id === topicId)
          .map((f) => f.content);

        // Send previous messages as conversation history
        const previousMessages = newMessages.slice(0, -1);
        const history = previousMessages.length > 0
          ? previousMessages.map((m) => ({ role: m.role, content: m.content }))
          : undefined;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: q,
            baby: baby ? { name: baby.name, gender: baby.gender, age: baby.age, born: baby.born } : undefined,
            facts: topicFacts.length > 0 ? topicFacts : undefined,
            history,
          }),
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n").filter(Boolean);

          for (const line of lines) {
            if (line === "data: [DONE]") continue;
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) {
                fullText += parsed.text;
                setLeadText(fullText);
              }
            } catch {
              // skip malformed
            }
          }
        }

        // Save assistant message
        let savedMsgId: string | undefined;
        if (currentConvoId) {
          const { data: savedMsg } = await supabase.from("messages").insert({
            conversation_id: currentConvoId,
            role: "assistant",
            content: fullText,
            sources: extractSources(fullText),
          }).select("id").single();
          savedMsgId = savedMsg?.id;

          // Update conversation timestamp
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", currentConvoId);
        }

        setMessages([...newMessages, { id: savedMsgId, role: "assistant", content: fullText, pinned: false }]);
        setBlocks(parseAnswer(fullText));
        setSources(extractSources(fullText));
        setDone(true);
        refreshConvos();
        refreshSuggestions(topicId);
      } catch {
        setLeadText("Something went wrong. Please try again.");
        setDone(true);
      } finally {
        setStreaming(false);
      }
    },
    [messages, convoId, familyId, topicId, baby, allFacts]
  );

  const handleSend = () => {
    if (input.trim()) sendQuestion(input);
  };

  const handlePin = async (msgId: string, currentlyPinned: boolean) => {
    const supabase = createClient();
    await supabase
      .from("messages")
      .update({ pinned: !currentlyPinned })
      .eq("id", msgId);
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, pinned: !currentlyPinned } : m)
    );
    refreshPins();
  };

  const hasAsked = messages.length > 0;

  // Split messages: previous completed pairs vs the current (latest) exchange
  const isLastAssistantDone = messages.length > 0 && messages[messages.length - 1].role === "assistant" && done && !streaming;
  // History = all fully completed messages (everything except the live exchange)
  const historyMessages = isLastAssistantDone
    ? messages // everything is done, show all as history
    : messages.slice(0, -1).concat([]); // exclude the last user message (it's the live one)
  // The current user question being answered (or just answered)
  const currentQuestion = isLastAssistantDone ? null : messages.filter((m) => m.role === "user").pop()?.content || null;

  if (!loaded) {
    return (
      <div className="min-h-[100dvh] bg-g-bg flex items-center justify-center">
        <span className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="g-dot" style={{ background: "var(--g-prim)", animationDelay: `${i * 0.16}s` }} />
          ))}
        </span>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-g-bg flex flex-col">
      <TopBar
        onBack={() => router.push(hasAsked ? `/topic/${topicId}` : "/home")}
        title={hasAsked ? (getTopicById(topicId)?.name || "Breastfeeding") : undefined}
        right={<DarkToggle />}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3">
        {!hasAsked ? (
          /* Empty state with suggestions */
          <div className="g-up pt-4">
            <div className="font-display text-[36px] leading-[1.05] text-g-ink mb-3">
              What&rsquo;s on your mind?
            </div>
            <div className="font-body text-[15px] leading-[1.55] text-g-sub mb-[26px]">
              I&rsquo;ll answer from the three books on the shelf
              {baby ? ` — with ${baby.name} in mind` : ""}. Type it, or tap the mic.
            </div>
            <Kicker className="mb-[13px]">Maybe start with</Kicker>
            <div className="flex flex-col gap-[10px]">
              {suggested.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendQuestion(s)}
                  className="text-left cursor-pointer bg-g-panel border-none rounded-[16px] py-[15px] px-[17px] font-display text-[19px] text-g-ink leading-[1.15] shadow-[var(--g-shadow-sm)] g-tap"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Previous messages (completed pairs) */}
            {historyMessages.map((msg, i) => (
              msg.role === "user" ? (
                <div key={i} className="flex flex-col items-end mb-[22px]">
                  <Kicker className="mb-[6px] mr-1">{me}</Kicker>
                  <div className="max-w-[86%] bg-g-prim text-g-on-prim rounded-[20px] rounded-br-[6px] py-[13px] px-[17px] font-body text-[15px] leading-[1.45]">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="mb-[26px]">
                  <div className="flex items-center gap-[9px] mb-[14px]">
                    <span className="w-7 h-7 rounded-full bg-g-prim text-g-on-prim flex items-center justify-center">
                      <Leaf size={15} />
                    </span>
                    <span className="font-display text-[19px] text-g-ink">Grounded</span>
                  </div>
                  <div className="font-body text-[15px] leading-[1.6] text-g-ink whitespace-pre-wrap">
                    {parseAnswer(msg.content).map((block, j) => (
                      <AnswerBlockRenderer key={j} block={block} />
                    ))}
                  </div>
                  {extractSources(msg.content).length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {extractSources(msg.content).map((s, j) => (
                        <span key={j} className="flex items-center gap-[6px] font-body text-[12.5px] font-semibold text-g-sub bg-g-panel rounded-[10px] py-[7px] px-3 shadow-[var(--g-shadow-sm)]">
                          <Book size={13} />{s}
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.id && (
                    <div className="flex gap-[9px] mt-[14px] mb-4">
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="flex items-center gap-[5px] font-body text-[12.5px] font-semibold text-g-sub bg-g-panel border-none rounded-[10px] py-2 px-3 cursor-pointer shadow-[var(--g-shadow-sm)]"
                      >
                        <Copy size={14} />Copy
                      </button>
                      <button
                        onClick={() => handlePin(msg.id!, !!msg.pinned)}
                        className={`flex items-center gap-[5px] font-body text-[12.5px] font-semibold border-none rounded-[10px] py-2 px-3 cursor-pointer shadow-[var(--g-shadow-sm)] ${msg.pinned ? "bg-g-prim-soft text-g-prim" : "bg-g-panel text-g-sub"}`}
                      >
                        <Pin size={14} className={msg.pinned ? "fill-current" : ""} />{msg.pinned ? "Pinned" : "Pin answer"}
                      </button>
                    </div>
                  )}
                </div>
              )
            ))}

            {/* Current live exchange (streaming or just finished) */}
            {currentQuestion && (
              <>
                <div className="flex flex-col items-end mb-[22px]">
                  <Kicker className="mb-[6px] mr-1">{me}</Kicker>
                  <div className="max-w-[86%] bg-g-prim text-g-on-prim rounded-[20px] rounded-br-[6px] py-[13px] px-[17px] font-body text-[15px] leading-[1.45]">
                    {currentQuestion}
                  </div>
                </div>

                <div className="g-up">
                  <div className="flex items-center gap-[9px] mb-[14px]">
                    <span className="w-7 h-7 rounded-full bg-g-prim text-g-on-prim flex items-center justify-center">
                      <Leaf size={15} />
                    </span>
                    <span className="font-display text-[19px] text-g-ink">Grounded</span>
                    {streaming && (
                      <span className="flex gap-[3px] ml-[2px]">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="g-dot" style={{ background: "var(--g-prim)", animationDelay: `${i * 0.16}s` }} />
                        ))}
                      </span>
                    )}
                  </div>

                  {(leadText || (done && blocks.length > 0)) && (
                    <div className="font-body text-[15px] leading-[1.6] text-g-ink">
                      {(done ? blocks : parseAnswer(leadText)).map((block, i) => (
                        <AnswerBlockRenderer key={i} block={block} />
                      ))}
                      {streaming && <span className="g-caret" style={{ background: "var(--g-prim)" }} />}
                    </div>
                  )}

                  {done && (
                    <>
                      {sources.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {sources.map((s, i) => (
                            <span key={i} className="flex items-center gap-[6px] font-body text-[12.5px] font-semibold text-g-sub bg-g-panel rounded-[10px] py-[7px] px-3 shadow-[var(--g-shadow-sm)]">
                              <Book size={13} />{s}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-[9px] mt-[14px] mb-4">
                        <button
                          onClick={() => {
                            const lastAssistant = messages.filter((m) => m.role === "assistant").pop();
                            if (lastAssistant) navigator.clipboard.writeText(lastAssistant.content);
                          }}
                          className="flex items-center gap-[5px] font-body text-[12.5px] font-semibold text-g-sub bg-g-panel border-none rounded-[10px] py-2 px-3 cursor-pointer shadow-[var(--g-shadow-sm)]"
                        >
                          <Copy size={14} />Copy
                        </button>
                        {(() => {
                          const lastAssistant = messages.filter((m) => m.role === "assistant").pop();
                          if (!lastAssistant?.id) return null;
                          return (
                            <button
                              onClick={() => handlePin(lastAssistant.id!, !!lastAssistant.pinned)}
                              className={`flex items-center gap-[5px] font-body text-[12.5px] font-semibold border-none rounded-[10px] py-2 px-3 cursor-pointer shadow-[var(--g-shadow-sm)] ${lastAssistant.pinned ? "bg-g-prim-soft text-g-prim" : "bg-g-panel text-g-sub"}`}
                            >
                              <Pin size={14} className={lastAssistant.pinned ? "fill-current" : ""} />{lastAssistant.pinned ? "Pinned" : "Pin answer"}
                            </button>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 bg-g-bg"
        style={{ padding: `10px 18px calc(env(safe-area-inset-bottom, 0px) + 8px)` }}
      >
        <div className="flex items-center gap-[9px] bg-g-panel rounded-[26px] py-[7px] pl-[18px] pr-[7px] shadow-[var(--g-shadow)]">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={hasAsked ? "Ask a follow-up\u2026" : "Type your question\u2026"}
            className="flex-1 border-none outline-none bg-transparent font-body text-[15px] text-g-ink py-[9px] min-w-0 placeholder:text-g-faint"
          />
          <button
            className="w-10 h-10 rounded-full border-none cursor-pointer flex items-center justify-center shrink-0"
            style={{
              background: input.trim() ? "var(--g-panel2)" : "var(--g-prim-soft)",
              color: input.trim() ? "var(--g-sub)" : "var(--g-prim)",
            }}
            aria-label="Voice input"
          >
            <Mic size={18} />
          </button>
          {input.trim() && (
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full border-none cursor-pointer bg-g-prim text-g-on-prim flex items-center justify-center shrink-0"
              aria-label="Send"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Parse streamed markdown into typed blocks */
function parseAnswer(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  const lines = text.split("\n");
  let currentParagraph = "";
  let currentOl: string[] = [];
  let currentUl: string[] = [];
  let isFirst = true;

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      blocks.push({
        type: isFirst ? "lead" : "p",
        md: currentParagraph.trim(),
      });
      isFirst = false;
      currentParagraph = "";
    }
  };

  const flushLists = () => {
    if (currentOl.length > 0) {
      blocks.push({ type: "ol", items: [...currentOl] });
      currentOl = [];
    }
    if (currentUl.length > 0) {
      blocks.push({ type: "ul", items: [...currentUl] });
      currentUl = [];
    }
  };

  const inList = () => currentOl.length > 0 || currentUl.length > 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Headings
    if (/^#{1,4}\s+/.test(trimmed)) {
      flushParagraph();
      flushLists();
      blocks.push({ type: "h", text: trimmed.replace(/^#+\s+/, "") });
      continue;
    }

    // Horizontal rules
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushParagraph();
      flushLists();
      continue;
    }

    // Numbered list items
    const listMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (listMatch) {
      flushParagraph();
      if (currentUl.length > 0) flushLists();
      currentOl.push(listMatch[1]);
      continue;
    }

    // Bullet list items
    if (trimmed.startsWith("- ") || trimmed.startsWith("\u2022 ")) {
      flushParagraph();
      if (currentOl.length > 0) flushLists();
      currentUl.push(trimmed.slice(2));
      continue;
    }

    // Blank lines: skip inside lists, flush paragraphs outside
    if (!trimmed) {
      if (!inList()) {
        flushParagraph();
      }
      continue;
    }

    // Non-blank text while inside a list: append to last item (multi-line)
    if (inList()) {
      if (currentOl.length > 0) {
        currentOl[currentOl.length - 1] += " " + trimmed;
      } else {
        currentUl[currentUl.length - 1] += " " + trimmed;
      }
      continue;
    }

    // Regular paragraph text
    if (currentParagraph) currentParagraph += " ";
    currentParagraph += trimmed;
  }

  flushLists();
  flushParagraph();
  return blocks;
}

/** Extract source book names from the answer text */
function extractSources(text: string): string[] {
  const sourceSet = new Set<string>();
  const patterns = [
    /\bHuggins\b/i,
    /\bMohrbacher\b/i,
    /\bLa Leche League\b/i,
  ];
  const labels = ["Huggins", "Mohrbacher", "La Leche League"];

  patterns.forEach((p, i) => {
    if (p.test(text)) sourceSet.add(labels[i]);
  });

  return Array.from(sourceSet);
}
