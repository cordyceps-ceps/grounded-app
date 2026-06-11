"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Sun, Moon, Leaf, Mic, Square, Loader, ArrowUp, Book, Copy, Pin, Phone, Play, ChevronRight, MessageCirclePlus, X } from "lucide-react";
import { TopBar, Kicker, IconBtn, Avatar } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/UserProvider";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { getTopicById } from "@/lib/topics";
import { parseAnswer, extractSources, mdInline, type AnswerBlock } from "@/lib/parseAnswer";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  pinned?: boolean;
  user_id?: string;
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
    const ytUrl = block.videoId ? `https://www.youtube.com/watch?v=${block.videoId}` : "#";
    return (
      <a
        href={ytUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="g-up mt-5 rounded-[18px] overflow-hidden bg-g-panel shadow-[var(--g-shadow)] block no-underline g-tap"
      >
        <div
          className="h-[140px] flex items-center justify-center relative bg-g-panel2"
        >
          {block.thumbnailUrl ? (
            <img
              src={block.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          <span className="w-[52px] h-[52px] rounded-full bg-g-prim text-g-on-prim flex items-center justify-center shadow-[0_5px_14px_rgba(0,0,0,0.25)] relative z-10">
            <Play size={22} />
          </span>
        </div>
        <div className="p-4">
          <Kicker color="var(--g-prim)" className="mb-[6px]">
            Here&rsquo;s a video that may help
          </Kicker>
          <div className="font-display text-[21px] text-g-ink leading-[1.05]">{block.title}</div>
          <div className="font-body text-[12.5px] text-g-faint mt-[5px]">
            {block.channel}{block.dur ? ` · ${block.dur}` : ""}
          </div>
        </div>
      </a>
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

const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  bf: [
    "Is cluster feeding normal in the evenings?",
    "How do I know she\u2019s getting enough milk?",
    "How do I get a deeper, comfier latch?",
  ],
  sleep: [
    "How long should naps be at this age?",
    "Is it normal for her to wake this often at night?",
    "How do I start a gentle bedtime routine?",
  ],
};
const DEFAULT_FALLBACK = [
  "What\u2019s normal at this age?",
  "Any tips for getting into a routine?",
  "When should I speak to a professional?",
];

export default function ChatPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const params = useParams();
  const searchParams = useSearchParams();
  const isNew = params.id === "new";
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const { scrollRef, scrollToBottom, resetScroll } = useAutoScroll(streaming);
  const [leadText, setLeadText] = useState("");
  const [blocks, setBlocks] = useState<AnswerBlock[]>([]);
  const [done, setDone] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [topicId, setTopicId] = useState(searchParams.get("topic") || "bf");
  const [convoId, setConvoId] = useState<string | null>(isNew ? null : (params.id as string));
  const [convoLoaded, setConvoLoaded] = useState(isNew);

  const { me, userId, familyId, baby: userBaby, facts: allFacts, suggestions, members, loaded: userLoaded, memberName, refreshConvos, refreshPins, refreshSuggestions } = useUser();
  const hasPartner = members.length > 1;
  const baby: BabyContext | null = userBaby
    ? { name: userBaby.name, gender: userBaby.gender, born: userBaby.born, age: userBaby.age || "" }
    : null;

  // Prefetch back targets
  useEffect(() => {
    router.prefetch("/home");
    router.prefetch(`/topic/${topicId}`);
  }, [router, topicId]);

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
          .select("id, role, content, pinned, user_id")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: true });

        if (msgs && msgs.length > 0) {
          setMessages(msgs as Message[]);
          const lastAssistant = msgs.filter((m: Message) => m.role === "assistant").pop();
          if (lastAssistant) {
            setBlocks(parseAnswer(lastAssistant.content));
            setSources(extractSources(lastAssistant.content, convo.topic_id));
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
  const suggested = cached?.questions?.length ? cached.questions : (FALLBACK_SUGGESTIONS[topicId] || DEFAULT_FALLBACK);

  useEffect(() => {
    if (loaded && isNew && isCacheStale && familyId) {
      refreshSuggestions(topicId);
    }
  }, [loaded, isNew, topicId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recover from interrupted streams: when tab becomes visible again,
  // check if DB has an answer we're missing (browser may have killed the fetch)
  useEffect(() => {
    if (!convoId) return;

    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;

      const sb = createClient();
      const { data: msgs } = await sb
        .from("messages")
        .select("id, role, content, pinned, user_id")
        .eq("conversation_id", convoId)
        .order("created_at", { ascending: true });

      if (!msgs || msgs.length === 0) return;

      const dbLastAssistant = msgs.filter((m: Message) => m.role === "assistant").pop();
      if (!dbLastAssistant || !dbLastAssistant.content) return;

      // Check if we're missing this answer locally
      const localLastAssistant = messages.filter((m) => m.role === "assistant").pop();
      const localMissing = !localLastAssistant || !localLastAssistant.content;
      const dbHasMore = localLastAssistant && dbLastAssistant.content.length > localLastAssistant.content.length;

      if (localMissing || dbHasMore) {
        setMessages(msgs as Message[]);
        setBlocks(parseAnswer(dbLastAssistant.content));
        setSources(extractSources(dbLastAssistant.content, topicId));
        setLeadText(dbLastAssistant.content);
        setDone(true);
        setStreaming(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [convoId, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [leadText, blocks, messages, scrollToBottom]);

  const sendQuestion = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || !familyId) return;

      resetScroll(); // reset so new answer auto-scrolls
      const newMessages: Message[] = [...messages, { role: "user", content: q }];
      setMessages(newMessages);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      setStreaming(true);
      setLeadText("");
      setBlocks([]);
      setDone(false);
      setSources([]);
      setFollowUps([]);

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
          user_id: userId || null,
        });
      }

      try {
        const topicFacts = allFacts
          .filter((f) => f.topic_id === topicId)
          .map((f) => f.content);
        const globalFacts = allFacts
          .filter((f) => !f.topic_id)
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
            globalFacts: globalFacts.length > 0 ? globalFacts : undefined,
            history,
            conversationId: currentConvoId,
            userId,
            topicId,
          }),
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");
        const decoder = new TextDecoder();
        let fullText = "";
        let sseBuffer = "";

        while (true) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) break;

          sseBuffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by \n\n)
          const parts = sseBuffer.split("\n\n");
          // Keep the last part as buffer (might be incomplete)
          sseBuffer = parts.pop() || "";

          for (const line of parts) {
            const trimmed = line.trim();
            if (trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.text) {
                fullText += parsed.text;
                setLeadText(fullText);
              }
            } catch {
              // skip malformed
            }
          }
        }

        // Assistant message is saved server-side; fetch its ID for pin/copy
        let savedMsgId: string | undefined;
        if (currentConvoId) {
          const { data: savedMsg } = await supabase
            .from("messages")
            .select("id")
            .eq("conversation_id", currentConvoId)
            .eq("role", "assistant")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          savedMsgId = savedMsg?.id;
        }

        setMessages([...newMessages, { id: savedMsgId, role: "assistant", content: fullText, pinned: false }]);
        setBlocks(parseAnswer(fullText));
        setSources(extractSources(fullText, topicId));
        setDone(true);
        refreshConvos();
        refreshSuggestions(topicId);

        // Generate follow-up questions (non-blocking)
        fetch("/api/followups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, answer: fullText, topicId }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.followups?.length > 0) setFollowUps(data.followups);
          })
          .catch(() => {});
      } catch {
        setLeadText("Something went wrong. Please try again.");
        setDone(true);
      } finally {
        setStreaming(false);
      }
    },
    [messages, convoId, familyId, topicId, baby, allFacts, userId]
  );

  const handleSend = () => {
    if (input.trim()) sendQuestion(input);
  };

  const handleMicPress = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setInput("Couldn\u2019t access your microphone. Check your browser settings.");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);

      const audioBlob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      if (audioBlob.size < 1000) return;

      setIsTranscribing(true);

      try {
        const formData = new FormData();
        const ext = recorder.mimeType?.includes("mp4") ? "m4a" : "webm";
        formData.append("audio", audioBlob, `recording.${ext}`);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Transcription failed");

        const { text } = await res.json();
        if (text) {
          setInput((prev) => (prev ? prev + " " + text : text));
          inputRef.current?.focus();
        }
      } catch {
        setInput("Voice didn\u2019t come through. Try again or type instead.");
      } finally {
        setIsTranscribing(false);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
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

  // Conversation age nudge: show after 10+ user messages
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const NUDGE_THRESHOLD = 10;
  const nudgeDismissKey = convoId ? `grounded-nudge-dismissed-${convoId}` : null;
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    if (typeof window === "undefined" || !nudgeDismissKey) return false;
    return localStorage.getItem(nudgeDismissKey) === "1";
  });
  const showNudge = userMessageCount >= NUDGE_THRESHOLD && !nudgeDismissed && !streaming;

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
    <div className="fixed inset-0 bg-g-bg flex flex-col">
      <TopBar
        onBack={() => startTransition(() => router.push(hasAsked ? `/topic/${topicId}` : "/home"))}
        title={hasAsked ? (getTopicById(topicId)?.name || "Grounded") : undefined}
        right={<div className="flex gap-[9px] items-center"><DarkToggle /><Avatar /></div>}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3">
        {!hasAsked ? (
          /* Empty state with suggestions */
          <div className="g-up pt-4">
            <div className="font-display text-[36px] leading-[1.05] text-g-ink mb-3">
              What&rsquo;s on your mind?
            </div>
            <div className="font-body text-[15px] leading-[1.55] text-g-sub mb-[26px]">
              I&rsquo;ll answer from the {getTopicById(topicId)?.sources?.length || "three"} books on the shelf
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
                  <Kicker className="mb-[6px] mr-1">{msg.user_id ? memberName(msg.user_id) || me : me}</Kicker>
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
                  {extractSources(msg.content, topicId).length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {extractSources(msg.content, topicId).map((s, j) => (
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
                  {/* Show follow-ups after the last assistant message */}
                  {i === historyMessages.length - 1 && msg.role === "assistant" && followUps.length > 0 && (
                    <div className="mt-4 mb-2">
                      <Kicker className="mb-[10px]">You might also ask</Kicker>
                      <div className="flex flex-col gap-[7px]">
                        {followUps.map((q, j) => (
                          <button
                            key={j}
                            onClick={() => sendQuestion(q)}
                            className="flex items-center gap-[10px] text-left font-body text-[13.5px] text-g-prim bg-g-prim-soft border-none rounded-[12px] py-[10px] px-[14px] cursor-pointer leading-[1.4]"
                          >
                            <span className="flex-1">{q}</span>
                            <ChevronRight size={15} className="shrink-0 opacity-50" />
                          </button>
                        ))}
                      </div>
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
                      {followUps.length > 0 && (
                        <div className="mt-4 mb-2">
                          <Kicker className="mb-[10px]">You might also ask</Kicker>
                          <div className="flex flex-col gap-[7px]">
                            {followUps.map((q, i) => (
                              <button
                                key={i}
                                onClick={() => sendQuestion(q)}
                                className="flex items-center gap-[10px] text-left font-body text-[13.5px] text-g-prim bg-g-prim-soft border-none rounded-[12px] py-[10px] px-[14px] cursor-pointer leading-[1.4]"
                              >
                                <span className="flex-1">{q}</span>
                                <ChevronRight size={15} className="shrink-0 opacity-50" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Conversation age nudge */}
      {showNudge && (
        <div className="shrink-0 px-4 pb-1 bg-g-bg">
          <div className="flex items-center gap-3 bg-g-honey-soft rounded-[14px] py-[11px] px-[14px]">
            <MessageCirclePlus size={18} className="text-g-honey shrink-0" />
            <div className="flex-1 font-body text-[13.5px] leading-[1.4] text-g-ink">
              This conversation is getting long — you&rsquo;ll get better answers if you{" "}
              <button
                onClick={() => startTransition(() => router.push(`/chat/new?topic=${topicId}`))}
                className="inline font-bold text-g-prim bg-transparent border-none p-0 cursor-pointer underline underline-offset-2"
              >
                start a new one
              </button>
            </div>
            <button
              onClick={() => {
                setNudgeDismissed(true);
                if (nudgeDismissKey) localStorage.setItem(nudgeDismissKey, "1");
              }}
              className="w-7 h-7 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center text-g-faint shrink-0"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="shrink-0 bg-g-bg relative -mt-px"
        style={{ padding: `11px 18px max(env(safe-area-inset-bottom, 0px) + 8px, 16px)` }}
      >
        <div className="flex items-end gap-[9px] bg-g-panel rounded-[26px] py-[7px] pl-[18px] pr-[7px] shadow-[var(--g-shadow)]">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 72) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={hasAsked ? "Ask a follow-up\u2026" : "Type your question\u2026"}
            className="flex-1 border-none outline-none bg-transparent font-body text-[15px] text-g-ink py-[9px] min-w-0 placeholder:text-g-faint resize-none leading-[1.5] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maxHeight: 72 }}
          />
          <button
            type="button"
            onClick={handleMicPress}
            disabled={streaming || isTranscribing}
            className="w-10 h-10 rounded-full border-none cursor-pointer flex items-center justify-center shrink-0"
            style={{
              background: isRecording
                ? "var(--g-honey)"
                : isTranscribing
                  ? "var(--g-panel2)"
                  : input.trim()
                    ? "var(--g-panel2)"
                    : "var(--g-prim-soft)",
              color: isRecording
                ? "var(--g-on-prim)"
                : isTranscribing
                  ? "var(--g-faint)"
                  : input.trim()
                    ? "var(--g-sub)"
                    : "var(--g-prim)",
              transition: "background 0.2s, color 0.2s",
            }}
            aria-label={isRecording ? "Stop recording" : isTranscribing ? "Transcribing\u2026" : "Voice input"}
          >
            {isRecording ? (
              <Square size={16} fill="currentColor" />
            ) : isTranscribing ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Mic size={18} />
            )}
          </button>
          <button
            type="submit"
            className="w-10 h-10 rounded-full border-none cursor-pointer bg-g-prim text-g-on-prim flex items-center justify-center shrink-0 transition-opacity"
            style={{ opacity: input.trim() ? 1 : 0, pointerEvents: input.trim() ? "auto" : "none", position: input.trim() ? "relative" : "absolute", right: input.trim() ? undefined : 7 }}
            aria-label="Send"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}


