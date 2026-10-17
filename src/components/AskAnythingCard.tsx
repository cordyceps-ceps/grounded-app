"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { SpotAskAnything } from "@/components/illustrations";
import { ALL_TOPIC_ID, searchableTopics } from "@/lib/topics";

export function AskAnythingCard() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const topics = searchableTopics();
  const books = topics.reduce((n, t) => n + t.sources.length, 0);

  const go = () => {
    const text = q.trim();
    const base = `/chat/new?topic=${ALL_TOPIC_ID}`;
    router.push(text ? `${base}&prefill=${encodeURIComponent(text)}` : base);
  };

  return (
    <div className="g-up relative overflow-hidden bg-g-prim text-g-on-prim rounded-[28px] p-[18px] pb-[16px] mb-[26px] shadow-[var(--g-shadow)]">
      <SpotAskAnything className="absolute -right-1 -top-3 w-[128px] h-auto" />
      <div className="font-body text-[11.5px] font-bold tracking-[1px] uppercase opacity-70 mb-[8px]">
        Not sure where to ask?
      </div>
      <div className="font-display text-[31px] leading-[1.02] pr-[130px] mb-[16px]">
        Ask <em>anything</em>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); go(); }}
        className="flex items-center gap-2 bg-g-panel text-g-ink rounded-full py-[6px] pl-[18px] pr-[6px]"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a question for every book…"
          aria-label="Ask anything across every guide"
          className="flex-1 min-w-0 border-none outline-none bg-transparent font-body text-[14.5px] text-g-ink placeholder:text-g-faint py-[8px]"
        />
        <button
          type="submit"
          aria-label="Ask"
          className="w-[38px] h-[38px] rounded-full border-none cursor-pointer bg-g-prim text-g-on-prim flex items-center justify-center shrink-0"
        >
          <ArrowUp size={17} />
        </button>
      </form>
      <div className="flex items-center gap-[9px] mt-[13px] font-body text-[12.5px] opacity-85">
        <span className="flex shrink-0">
          {topics.map((t, i) => (
            <span
              key={t.id}
              className="w-[14px] h-[14px] rounded-full border-2 border-g-prim"
              style={{ background: `var(--g-t-${t.hue})`, marginLeft: i ? -5 : 0 }}
            />
          ))}
        </span>
        <span>Searches all {topics.length} guides · {books} books</span>
      </div>
    </div>
  );
}
