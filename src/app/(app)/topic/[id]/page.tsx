"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sun, Moon, Plus, Pin, Pencil, Trash2, ChevronRight, Clock, Play } from "lucide-react";
import { TopBar, Kicker, Cover, Button, IconBtn, Sheet, Field } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";
import { getTopicById } from "@/lib/topics";

// Mock data
const MOCK_BABY = { name: "Theo", age: "3 weeks, 4 days", dob: "9 May 2026", weight: "3.4 kg", born: true };
const MOCK_FACTS = [
  { id: "f1", text: "Currently cluster feeding in the evenings", age: "updated 4 days ago", pinned: false, stale: false },
  { id: "f2", text: "Tongue tie diagnosed week 1, snipped week 2", age: "pinned \u00b7 always relevant", pinned: true, stale: false },
  { id: "f3", text: "Feeds roughly every 2 hours through the day", age: "updated 18 days ago", pinned: false, stale: true },
];
const MOCK_CONVOS = [
  { id: "c1", title: "Is cluster feeding normal in the evenings?", who: "Tess", when: "2h ago" },
  { id: "c2", title: "How do I know if he\u2019s getting enough milk?", who: "Nick", when: "Yesterday" },
  { id: "c3", title: "Cracked nipple on the left \u2014 what helps?", who: "Tess", when: "3 days ago" },
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

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const topic = getTopicById(params.id as string);
  const [facts, setFacts] = useState(MOCK_FACTS);
  const [editFact, setEditFact] = useState<{ id: string; text: string } | null>(null);
  const [newFact, setNewFact] = useState(false);
  const [factText, setFactText] = useState("");

  if (!topic) return null;

  const baby = MOCK_BABY;
  const convos = topic.ready ? MOCK_CONVOS : [];
  const staleFacts = facts.filter((f) => f.stale && !f.pinned);
  const topicFacts = topic.ready ? facts : [];

  const pinFact = (id: string) => setFacts((fs) => fs.map((f) => (f.id === id ? { ...f, pinned: true, stale: false } : f)));
  const deleteFact = (id: string) => setFacts((fs) => fs.filter((f) => f.id !== id));

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col relative">
      <TopBar onBack={() => router.push("/home")} right={<DarkToggle />} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: `4px 20px ${topic.ready ? "calc(env(safe-area-inset-bottom, 0px) + 96px)" : "calc(env(safe-area-inset-bottom, 0px) + 24px)"}` }}
      >
        {/* Title */}
        <div className="g-up font-display text-[40px] leading-[1.02] text-g-ink mb-5">{topic.name}</div>

        {/* Stale facts banner */}
        {staleFacts.length > 0 && (
          <div className="g-up bg-g-honey-soft rounded-[18px] p-[17px] mb-[18px]">
            <div className="font-display text-[21px] text-g-ink mb-[3px]">Worth a quick check?</div>
            <div className="font-body text-[13.5px] text-g-sub mb-[13px] leading-[1.45]">
              Some facts about {baby.name} might be out of date.
            </div>
            {staleFacts.map((f) => (
              <div key={f.id} className="bg-g-panel rounded-[14px] p-[14px]">
                <div className="font-body text-[14.5px] font-semibold text-g-ink mb-1">{f.text}</div>
                <div className="font-body text-[12px] text-g-faint mb-[11px]">{f.age}</div>
                <div className="flex gap-2">
                  <button onClick={() => pinFact(f.id)} className="flex items-center gap-[5px] font-body text-[12.5px] font-semibold text-g-on-prim bg-g-prim border-none rounded-[10px] py-2 px-3 cursor-pointer">
                    <Pin size={13} />Pin
                  </button>
                  <button onClick={() => setEditFact({ id: f.id, text: f.text })} className="flex items-center gap-[5px] font-body text-[12.5px] font-semibold text-g-sub bg-g-panel2 border-none rounded-[10px] py-2 px-3 cursor-pointer">
                    <Pencil size={13} />Edit
                  </button>
                  <button onClick={() => deleteFact(f.id)} className="flex items-center gap-[5px] font-body text-[12.5px] font-semibold text-g-sub bg-g-panel2 border-none rounded-[10px] py-2 px-3 cursor-pointer">
                    <Trash2 size={13} />Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Baby context card */}
        <div className="g-up bg-g-panel rounded-[20px] p-[19px] mb-[26px] shadow-[var(--g-shadow)]">
          <div className="flex justify-between items-baseline">
            <div className="font-display text-[30px] text-g-ink leading-[1]">{baby.name}</div>
            <div className="font-body text-[13px] text-g-faint">{baby.born ? baby.age : `due ${baby.dob}`}</div>
          </div>
          <div className="font-body text-[12.5px] text-g-faint mt-1 mb-[15px]">
            {baby.born ? `born ${baby.dob} \u00b7 ${baby.weight}` : "not yet born"}
          </div>

          <Kicker color="var(--g-prim)" className="mb-[11px]">What Grounded keeps in mind</Kicker>

          {!topic.ready ? (
            <div className="bg-g-panel2 rounded-[13px] p-[14px]">
              <div className="font-body text-[13.5px] leading-[1.5] text-g-sub">
                You&rsquo;ll add facts about {baby.name} here once this guide opens.
              </div>
            </div>
          ) : topicFacts.length === 0 ? (
            <div className="bg-g-panel2 rounded-[13px] p-[15px]">
              <div className="font-body text-[13.5px] leading-[1.5] text-g-sub mb-3">
                Tell Grounded something that&rsquo;s true for {baby.name} right now — like how feeding&rsquo;s going — and answers get more relevant.
              </div>
              <Button size="sm" variant="soft" icon={Plus} onClick={() => setNewFact(true)}>
                Add a fact
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-[9px]">
                {topicFacts.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setEditFact({ id: f.id, text: f.text })}
                    className="text-left bg-transparent border-none cursor-pointer flex gap-[10px] items-start p-0"
                  >
                    <span
                      className="mt-[6px] w-[6px] h-[6px] rounded-full shrink-0"
                      style={{ background: f.pinned ? "var(--g-honey)" : "var(--g-prim)" }}
                    />
                    <span className="font-body text-[14px] leading-[1.45] text-g-ink">
                      {f.text}
                      {f.pinned && <span className="text-g-faint text-[12px]"> · pinned</span>}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setNewFact(true)}
                className="mt-[13px] flex items-center gap-[6px] bg-transparent border-none cursor-pointer font-body text-[13.5px] font-bold text-g-prim p-0"
              >
                <Plus size={15} />Add a fact
              </button>
            </>
          )}
        </div>

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
                  <button
                    key={c.id}
                    onClick={() => router.push(`/chat/${c.id}`)}
                    className="w-full text-left cursor-pointer bg-g-panel border-none rounded-[14px] py-[14px] px-4 shadow-[var(--g-shadow-sm)] flex justify-between gap-[10px] items-center"
                  >
                    <span className="min-w-0">
                      <span className="block font-body text-[14.5px] font-semibold text-g-ink leading-[1.3]">{c.title}</span>
                      <span className="block font-body text-[12px] text-g-faint mt-[3px]">{c.who} · {c.when}</span>
                    </span>
                    <span className="text-g-faint shrink-0"><ChevronRight size={16} /></span>
                  </button>
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
          className="absolute left-0 right-0 bottom-0 z-[5]"
          style={{
            padding: `14px 20px calc(env(safe-area-inset-bottom, 0px) + 12px)`,
            background: `linear-gradient(to top, var(--g-bg) 60%, transparent)`,
          }}
        >
          <Button full icon={Plus} onClick={() => router.push("/chat/new")}>
            Ask something new
          </Button>
        </div>
      )}

      {/* Edit/New fact sheet */}
      <Sheet
        open={!!editFact || newFact}
        onClose={() => { setEditFact(null); setNewFact(false); setFactText(""); }}
        title={editFact ? "Edit fact" : "Add a fact"}
      >
        <Field
          label={`What\u2019s true for ${baby.name} right now?`}
          value={editFact ? editFact.text : factText}
          onChange={(e) => editFact ? setEditFact({ ...editFact, text: e.target.value }) : setFactText(e.target.value)}
          placeholder="e.g. Currently cluster feeding in the evenings"
        />
        <div className="mt-4">
          <Button full onClick={() => { setEditFact(null); setNewFact(false); setFactText(""); }}>
            Save
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
