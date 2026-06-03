"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sun, Moon, Plus, Pin, Pencil, Trash2, ChevronRight, Clock, Play } from "lucide-react";
import { TopBar, Kicker, Cover, Button, IconBtn, Sheet, Field } from "@/components/ui";
import { useTheme } from "@/components/ThemeProvider";
import { getTopicById } from "@/lib/topics";
import { createClient } from "@/lib/supabase/client";
import { formatBabyAge } from "@/lib/utils";

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

interface BabyData {
  name: string;
  born: boolean;
  dob: string | null;
  due_date: string | null;
  birth_weight: string | null;
}

interface ConvoRow {
  id: string;
  title: string | null;
  updated_at: string;
}

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const topic = getTopicById(params.id as string);
  const [editFact, setEditFact] = useState<{ id: string; text: string } | null>(null);
  const [newFact, setNewFact] = useState(false);
  const [factText, setFactText] = useState("");
  const [baby, setBaby] = useState<BabyData | null>(null);
  const [convos, setConvos] = useState<ConvoRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        const { data: babies } = await supabase
          .from("baby_profiles")
          .select("name, born, dob, due_date, birth_weight")
          .eq("family_id", profile.family_id)
          .limit(1);

        if (babies && babies.length > 0) {
          setBaby(babies[0]);
        }

        if (topic?.ready) {
          const { data: conversations } = await supabase
            .from("conversations")
            .select("id, title, updated_at")
            .eq("family_id", profile.family_id)
            .eq("topic_id", params.id)
            .order("updated_at", { ascending: false })
            .limit(20);

          if (conversations) {
            setConvos(conversations);
          }
        }
      }
      setLoaded(true);
    };
    load();
  }, [params.id, topic?.ready]);

  if (!topic) return null;

  const babyAge = baby?.born && baby.dob ? formatBabyAge(baby.dob) : null;
  const babyDobFormatted = baby?.dob
    ? new Date(baby.dob).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col relative">
      <TopBar onBack={() => router.push("/home")} right={<DarkToggle />} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: `4px 20px ${topic.ready ? "calc(env(safe-area-inset-bottom, 0px) + 96px)" : "calc(env(safe-area-inset-bottom, 0px) + 24px)"}` }}
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
            {!loaded ? (
              <div className="flex justify-center py-4">
                <span className="flex gap-[3px]">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="g-dot" style={{ background: "var(--g-prim)", animationDelay: `${i * 0.16}s` }} />
                  ))}
                </span>
              </div>
            ) : convos.length === 0 ? (
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
                      <span className="block font-body text-[14.5px] font-semibold text-g-ink leading-[1.3]">
                        {c.title || "Untitled conversation"}
                      </span>
                      <span className="block font-body text-[12px] text-g-faint mt-[3px]">{timeAgo(c.updated_at)}</span>
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
          className="fixed left-0 right-0 bottom-0 z-[5]"
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

      {/* New fact sheet (placeholder for future) */}
      <Sheet
        open={!!editFact || newFact}
        onClose={() => { setEditFact(null); setNewFact(false); setFactText(""); }}
        title={editFact ? "Edit fact" : "Add a fact"}
      >
        <Field
          label={`What\u2019s true for ${baby?.name || "your baby"} right now?`}
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
