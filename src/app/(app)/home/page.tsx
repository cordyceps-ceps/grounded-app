"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, ChevronRight, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { TopBar, Kicker, IconBtn } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";
import { TOPICS } from "@/lib/topics";
import { getGreeting } from "@/lib/utils";

// Mock data — will be replaced with Supabase queries
const MOCK_BABY = { name: "Theo", age: "3 weeks, 4 days", dob: "2026-05-09", born: true };
const MOCK_ME = "Nick";
const MOCK_CONVOS = [
  { id: "c1", title: "Is cluster feeding normal in the evenings?", who: "Tess", when: "2h ago", topicId: "bf" },
  { id: "c2", title: "How do I know if he\u2019s getting enough milk?", who: "Nick", when: "Yesterday", topicId: "bf" },
  { id: "c3", title: "Cracked nipple on the left \u2014 what helps?", who: "Tess", when: "3 days ago", topicId: "bf" },
  { id: "c4", title: "Preparing to breastfeed before the birth", who: "Nick", when: "Last week", topicId: "bf" },
];

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
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/topic/${topic.id}`)}
      className="g-up w-full text-left cursor-pointer bg-g-panel border-none rounded-[18px] p-4 shadow-[var(--g-shadow-sm)] flex gap-[15px] items-center"
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
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const baby = MOCK_BABY;
  const me = MOCK_ME;
  const convos = MOCK_CONVOS;
  const topics = TOPICS;

  const sub = baby.born
    ? `${baby.name} is ${baby.age} old. What\u2019s on your mind tonight?`
    : `${baby.name} is on the way. What\u2019s on your mind?`;

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
              <Avatar name={me} active />
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
                <button
                  key={c.id}
                  onClick={() => router.push(`/chat/${c.id}`)}
                  className="g-up text-left cursor-pointer bg-g-panel border-none rounded-[16px] py-[15px] px-[17px] shadow-[var(--g-shadow-sm)] flex gap-3 items-center"
                >
                  <span className="w-9 h-9 rounded-[12px] bg-g-prim-soft text-g-prim flex items-center justify-center shrink-0">
                    <MessageSquare size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-body text-[15px] font-semibold text-g-ink leading-[1.3]">
                      {c.title}
                    </span>
                    <span className="block font-body text-[12px] text-g-faint mt-[3px]">
                      Breastfeeding · {c.who} · {c.when}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
