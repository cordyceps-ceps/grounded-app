"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Sun, Moon, Plus, ChevronRight, Clock, Play } from "lucide-react";
import { TopBar, Kicker, Cover, Button, IconBtn, Sheet, Field } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@/components/UserProvider";
import { getTopicById } from "@/lib/topics";

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

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const topic = getTopicById(params.id as string);
  const { baby, convos: allConvos } = useUser();
  const [newFact, setNewFact] = useState(false);
  const [factText, setFactText] = useState("");

  if (!topic) return null;

  const convos = topic.ready ? allConvos.filter((c) => c.topic_id === topic.id) : [];

  const babyAge = baby?.age;
  const babyDobFormatted = baby?.dob
    ? new Date(baby.dob).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="h-[100dvh] bg-g-bg flex flex-col">
      <TopBar onBack={() => router.push("/home")} right={<DarkToggle />} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: `4px 20px calc(env(safe-area-inset-bottom, 0px) + ${topic.ready ? "16px" : "24px"})` }}
      >
        {/* Title */}
        <div className="g-up font-display text-[40px] leading-[1.02] text-g-ink mb-5">{topic.name}</div>

        {/* Baby context card */}
        {baby && (
          <div className="g-up bg-g-panel rounded-[20px] p-[19px] mb-[26px] shadow-[var(--g-shadow)]">
            <div className="flex justify-between items-baseline">
              <div className="font-display text-[30px] text-g-ink leading-[1]">{baby.name}</div>
              <div className="font-body text-[13px] text-g-faint">
                {baby.born ? (babyAge ? `${babyAge} old` : "") : baby.due_date ? `due ${new Date(baby.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "expecting"}
              </div>
            </div>
            <div className="font-body text-[12.5px] text-g-faint mt-1 mb-[15px]">
              {baby.born
                ? `born ${babyDobFormatted || ""}${baby.birth_weight ? ` \u00b7 ${baby.birth_weight} kg` : ""}`
                : "not yet born"}
            </div>

            <Kicker color="var(--g-prim)" className="mb-[11px]">What Grounded keeps in mind</Kicker>

            {!topic.ready ? (
              <div className="bg-g-panel2 rounded-[13px] p-[14px]">
                <div className="font-body text-[13.5px] leading-[1.5] text-g-sub">
                  You&rsquo;ll add facts about {baby.name} here once this guide opens.
                </div>
              </div>
            ) : (
              <div className="bg-g-panel2 rounded-[13px] p-[15px]">
                <div className="font-body text-[13.5px] leading-[1.5] text-g-sub mb-3">
                  Tell Grounded something that&rsquo;s true for {baby.name} right now — like how feeding&rsquo;s going — and answers get more relevant.
                </div>
                <Button size="sm" variant="soft" icon={Plus} onClick={() => setNewFact(true)}>
                  Add a fact
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Sources */}
        <Kicker className="mb-[14px]">On the shelf</Kicker>
        <div className="g-up flex flex-col gap-[14px] mb-[14px]">
          {topic.sources.map((s, i) => (
            <div key={i} className="flex gap-[15px] items-center">
              <Cover spine={s.spine} w={46} h={62} />
              <span className="flex-1 min-w-0">
                <span className="block font-display text-[20px] text-g-ink leading-[1.1]">{s.title}</span>
                <span className="block font-body text-[12.5px] text-g-faint mt-[3px]">{s.author}</span>
              </span>
              <span className="font-body text-[12.5px] font-bold text-g-prim bg-g-prim-soft rounded-[10px] py-[7px] px-3">
                Buy
              </span>
            </div>
          ))}
          {topic.video && (
            <div className="flex gap-[15px] items-center">
              <span className="w-[46px] h-[62px] rounded-[4px] bg-g-panel2 flex items-center justify-center text-g-prim shrink-0">
                <Play size={20} />
              </span>
              <span className="flex-1">
                <span className="block font-display text-[20px] text-g-ink leading-[1.1]">{topic.video.channel}</span>
                <span className="block font-body text-[12.5px] text-g-faint mt-[3px]">Video channel · latching & holds</span>
              </span>
              <span className="font-body text-[12.5px] font-bold text-g-prim bg-g-prim-soft rounded-[10px] py-[7px] px-3">
                Open
              </span>
            </div>
          )}
        </div>
        <div className="font-body text-[13px] italic text-g-sub mb-[26px] leading-[1.5]">
          {topic.note || "These are the books Grounded draws from for this guide. Consider supporting the authors."}
        </div>

        {/* Conversations or "Being curated" */}
        {topic.ready ? (
          <>
            <Kicker className="mb-3">Conversations here</Kicker>
            {convos.length === 0 ? (
              <div className="bg-g-panel2 rounded-[16px] py-[18px] px-4 text-center">
                <div className="font-body text-[14px] text-g-sub leading-[1.5]">
                  No questions yet. Tap <strong className="text-g-ink">Ask something new</strong> below to start.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-[10px]">
                {convos.map((c) => (
                  <Link
                    key={c.id}
                    href={`/chat/${c.id}`}
                    prefetch
                    className="w-full no-underline bg-g-panel rounded-[14px] py-[14px] px-4 shadow-[var(--g-shadow-sm)] flex justify-between gap-[10px] items-center g-tap"
                  >
                    <span className="min-w-0">
                      <span className="block font-body text-[14.5px] font-semibold text-g-ink leading-[1.3]">
                        {c.title || "Untitled conversation"}
                      </span>
                      <span className="block font-body text-[12px] text-g-faint mt-[3px]">{timeAgo(c.updated_at)}</span>
                    </span>
                    <span className="text-g-faint shrink-0"><ChevronRight size={16} /></span>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-g-panel rounded-[18px] p-5 shadow-[var(--g-shadow-sm)] text-center">
            <div className="w-[46px] h-[46px] rounded-full bg-g-honey-soft text-g-honey flex items-center justify-center mx-auto mb-3">
              <Clock size={22} />
            </div>
            <div className="font-display text-[23px] text-g-ink mb-[6px]">Being curated</div>
            <div className="font-body text-[13.5px] text-g-sub leading-[1.5] max-w-[270px] mx-auto">
              Nick is choosing and vetting the books for this guide. It&rsquo;ll open here as soon as it&rsquo;s ready
              {topic.care ? ", with extra care for this one" : ""}.
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {topic.ready && (
        <div
          className="shrink-0 bg-g-bg border-t border-g-line"
          style={{
            padding: `14px 20px calc(env(safe-area-inset-bottom, 0px) + 12px)`,
          }}
        >
          <Button full icon={Plus} onClick={() => router.push("/chat/new")}>
            Ask something new
          </Button>
        </div>
      )}

      {/* New fact sheet (placeholder for future) */}
      <Sheet
        open={newFact}
        onClose={() => { setNewFact(false); setFactText(""); }}
        title="Add a fact"
      >
        <Field
          label={`What\u2019s true for ${baby?.name || "your baby"} right now?`}
          value={factText}
          onChange={(e) => setFactText(e.target.value)}
          placeholder="e.g. Currently cluster feeding in the evenings"
        />
        <div className="mt-4">
          <Button full onClick={() => { setNewFact(false); setFactText(""); }}>
            Save
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
