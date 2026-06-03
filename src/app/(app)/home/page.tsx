"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Moon, ChevronRight, ChevronDown, ChevronUp, MessageSquare, Download, X, Share } from "lucide-react";
import { TopBar, Kicker, IconBtn } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@/components/UserProvider";
import { TOPICS } from "@/lib/topics";
import { getGreeting } from "@/lib/utils";

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

function Avatar({ name, active }: { name: string; active?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full font-body text-[13px] font-bold shrink-0 shadow-[var(--g-shadow-sm)]
        ${active ? "bg-g-prim text-g-on-prim" : "bg-g-panel2 text-g-sub"}`}
      style={{ width: 34, height: 34 }}
    >
      {name[0]}
    </span>
  );
}

function TopicCard({ topic }: { topic: (typeof TOPICS)[0] }) {
  return (
    <Link
      href={`/topic/${topic.id}`}
      prefetch
      className="g-up g-tap w-full text-left no-underline bg-g-panel rounded-[18px] p-4 shadow-[var(--g-shadow-sm)] flex gap-[15px] items-center"
    >
      <span className="flex shrink-0">
        {topic.sources.slice(0, 3).map((s, i) => (
          <span
            key={i}
            className="rounded-[3px]"
            style={{
              width: 16,
              height: 44,
              background: s.spine,
              marginLeft: i ? -7 : 0,
              boxShadow: "inset -2px 0 0 rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.22)",
              outline: "1.5px solid var(--g-panel)",
            }}
          />
        ))}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-display text-[23px] text-g-ink leading-[1.05]">{topic.name}</span>
        <span className="block font-body text-[12.5px] text-g-faint mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {topic.blurb}
        </span>
      </span>
      {topic.ready ? (
        <span className="text-g-faint shrink-0">
          <ChevronRight size={16} />
        </span>
      ) : (
        <span className="shrink-0 font-body text-[10.5px] font-bold tracking-[0.6px] uppercase text-g-honey bg-g-honey-soft rounded-[8px] py-[5px] px-[9px]">
          Soon
        </span>
      )}
    </Link>
  );
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const promptRef = useRef<Event | null>(null);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed before
    if (localStorage.getItem("grounded-install-dismissed")) return;

    // Android/Chrome: capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: show manual hint
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);
    if (isIos && isSafari) setShowIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    const prompt = promptRef.current as { prompt: () => Promise<void> } | null;
    if (prompt) {
      await prompt.prompt();
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("grounded-install-dismissed", "1");
  };

  if (dismissed) return null;
  if (!deferredPrompt && !showIosHint) return null;

  return (
    <div className="g-up bg-g-prim-soft rounded-[16px] p-4 mb-5 flex items-center gap-3">
      <span className="w-10 h-10 rounded-full bg-g-prim text-g-on-prim flex items-center justify-center shrink-0">
        <Download size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-body text-[14px] font-semibold text-g-ink leading-[1.3]">
          Add Grounded to your home screen
        </div>
        {showIosHint ? (
          <div className="font-body text-[12.5px] text-g-sub mt-[3px] leading-[1.4] flex items-center gap-1">
            Tap <Share size={12} className="inline text-g-prim" /> then &ldquo;Add to Home Screen&rdquo;
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="mt-[5px] font-body text-[12.5px] font-bold text-g-prim bg-transparent border-none p-0 cursor-pointer"
          >
            Install now
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 bg-transparent border-none p-1 cursor-pointer text-g-faint"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const { me, baby, convos, loaded } = useUser();
  const topics = TOPICS;

  const sub = baby
    ? baby.born
      ? `${baby.name} is ${baby.age} old. What\u2019s on your mind?`
      : `${baby.name} is on the way. What\u2019s on your mind?`
    : "What\u2019s on your mind?";

  const topicName = (id: string) => topics.find((t) => t.id === id)?.name || id;

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
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar
        logo
        right={
          <div className="flex gap-[9px] items-center">
            <DarkToggle />
            <button
              onClick={() => router.push("/settings")}
              className="border-none bg-transparent p-0 cursor-pointer"
              aria-label="Settings"
            >
              <Avatar name={me || "P"} active />
            </button>
          </div>
        }
      />

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "6px 20px calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
      >
        {/* Greeting */}
        <div className="g-up py-[14px] pb-6">
          <div className="font-display text-[42px] leading-[1.02] text-g-ink">
            {getGreeting()},
            <br />
            <span className="italic text-g-prim">{me}.</span>
          </div>
          <div className="font-body text-[15px] text-g-sub mt-[13px] leading-[1.5]">{sub}</div>
        </div>

        <InstallBanner />

        {/* Topics */}
        <Kicker className="mb-3">Topics</Kicker>
        <div className="mb-7">
          <div className="flex flex-col gap-[10px]">
            {(expanded ? topics : topics.slice(0, 4)).map((t) => (
              <TopicCard key={t.id} topic={t} />
            ))}
          </div>
          {topics.length > 4 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center justify-center gap-[7px] w-full mt-3 py-[11px] bg-transparent border-[1.5px] border-g-line rounded-[14px] cursor-pointer font-body text-[13.5px] font-bold text-g-sub"
            >
              {expanded ? "Show fewer" : `Show all ${topics.length} topics`}
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </div>

        {/* Recent conversations */}
        {convos.length === 0 ? (
          <div className="g-up bg-g-panel2 rounded-[18px] p-5 text-center">
            <div className="font-body text-[13.5px] text-g-sub leading-[1.5] max-w-[260px] mx-auto">
              Pick a topic above to ask your first question. Quiet for now — that&rsquo;s perfectly fine.
            </div>
          </div>
        ) : (
          <>
            <Kicker className="mb-[14px]">Lately</Kicker>
            <div className="flex flex-col gap-[11px]">
              {convos.map((c) => (
                <Link
                  key={c.id}
                  href={`/chat/${c.id}`}
                  prefetch
                  className="g-up g-tap no-underline bg-g-panel rounded-[16px] py-[15px] px-[17px] shadow-[var(--g-shadow-sm)] flex gap-3 items-center"
                >
                  <span className="w-9 h-9 rounded-[12px] bg-g-prim-soft text-g-prim flex items-center justify-center shrink-0">
                    <MessageSquare size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-body text-[15px] font-semibold text-g-ink leading-[1.3]">
                      {c.title || "Untitled conversation"}
                    </span>
                    <span className="block font-body text-[12px] text-g-faint mt-[3px]">
                      {topicName(c.topic_id)} · {timeAgo(c.updated_at)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
