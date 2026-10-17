"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Sun, Moon, Plus, ChevronRight, ChevronDown, Play, Pin, Pencil, Trash2, AlertTriangle, Phone, Globe } from "lucide-react";
import { TopBar, Kicker, Cover, Button, IconBtn, Sheet, Field, Avatar } from "@/components/ui";
import { TopicArt, SpotConversations, SpotCurating } from "@/components/illustrations";
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@/components/UserProvider";
import { getTopicById } from "@/lib/topics";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";

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

const STALE_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

function isStale(updatedAt: string, pinned: boolean): boolean {
  if (pinned) return false;
  return Date.now() - new Date(updatedAt).getTime() > STALE_MS;
}

export default function TopicPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const params = useParams();
  const topic = getTopicById(params.id as string);
  const { baby, convos: allConvos, facts: allFacts, pins: allPins, familyId, refreshFacts, refreshPins } = useUser();

  // Prefetch common navigation targets
  useEffect(() => {
    router.prefetch("/home");
    router.prefetch("/settings");
    if (topic) router.prefetch(`/chat/new?topic=${topic.id}`);
  }, [router, topic]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [factText, setFactText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [factsExpanded, setFactsExpanded] = useState(false);

  if (!topic) return null;

  const convos = topic.ready ? allConvos.filter((c) => c.topic_id === topic.id) : [];
  const topicFacts = allFacts.filter((f) => f.topic_id === topic.id);
  const globalFacts = allFacts.filter((f) => !f.topic_id);
  const allVisibleFacts = [...topicFacts, ...globalFacts];
  const topicPins = allPins.filter((p) => p.topic_id === topic.id);
  const staleFacts = topicFacts.filter((f) => isStale(f.updated_at, f.pinned));
  const COLLAPSE_THRESHOLD = 4;
  const shouldCollapse = allVisibleFacts.length > COLLAPSE_THRESHOLD && !factsExpanded;

  const babyAge = baby?.age;
  const babyDobFormatted = baby?.dob
    ? new Date(baby.dob).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const openAdd = () => {
    setEditingId(null);
    setFactText("");
    setSheetOpen(true);
  };

  const openEdit = (fact: { id: string; content: string }) => {
    setEditingId(fact.id);
    setFactText(fact.content);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    const text = factText.trim();
    if (!text || !familyId) return;
    setSaving(true);
    const supabase = createClient();

    if (editingId) {
      await supabase
        .from("topic_facts")
        .update({ content: text, updated_at: new Date().toISOString() })
        .eq("id", editingId);
    } else {
      await supabase.from("topic_facts").insert({
        family_id: familyId,
        topic_id: topic.id,
        content: text,
      });
    }

    await refreshFacts();
    setSaving(false);
    setSheetOpen(false);
    setFactText("");
    setEditingId(null);
  };

  const handleDelete = async (factId: string) => {
    const supabase = createClient();
    await supabase.from("topic_facts").delete().eq("id", factId);
    setExpandedId(null);
    await refreshFacts();
  };

  const handlePin = async (factId: string, currentlyPinned: boolean) => {
    const supabase = createClient();
    await supabase
      .from("topic_facts")
      .update({ pinned: !currentlyPinned, updated_at: new Date().toISOString() })
      .eq("id", factId);
    await refreshFacts();
  };

  const handleUnpinAnswer = async (msgId: string) => {
    const supabase = createClient();
    await supabase.from("messages").update({ pinned: false }).eq("id", msgId);
    await refreshPins();
  };

  return (
    <div className="fixed inset-0 bg-g-bg flex flex-col">
      <TopBar onBack={() => startTransition(() => router.push("/home"))} right={<div className="flex gap-[9px] items-center"><DarkToggle /><Avatar /></div>} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: `4px 20px calc(env(safe-area-inset-bottom, 0px) + ${topic.ready ? "16px" : "24px"})` }}
      >
        {/* Title */}
        <div
          className="g-up relative overflow-hidden rounded-[28px] text-g-ink mb-5"
          style={{ background: `var(--g-t-${topic.hue})`, minHeight: 176, padding: "22px 22px 20px" }}
        >
          <div className="relative z-10 max-w-[62%]">
            <div className="font-body text-[11px] font-bold tracking-[1px] uppercase opacity-65 mb-[10px]">
              {topic.ready ? `${topic.sources.length} ${topic.sources.length === 1 ? "book" : "books"}` : "Being curated"}
            </div>
            <div className="font-display text-[38px] leading-[1.0]">{topic.name}</div>
            <div className="font-body text-[13px] leading-[1.45] mt-[10px] opacity-80">{topic.blurb}</div>
          </div>
          <TopicArt
            topicId={topic.id}
            width={150}
            height={150}
            className="absolute -right-4 -bottom-4"
          />
        </div>

        {/* Baby context card */}
        {baby && (
          <div className="g-up bg-g-panel rounded-[26px] p-[20px] mb-[28px] shadow-[var(--g-shadow-sm)]">
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
              <div className="bg-g-panel2 rounded-[18px] p-[14px]">
                <div className="font-body text-[13.5px] leading-[1.5] text-g-sub">
                  You&rsquo;ll add facts about {baby.name} here once this guide opens.
                </div>
              </div>
            ) : (
              <div className="bg-g-panel2 rounded-[18px] p-[15px]">
                {/* Stale facts banner */}
                {staleFacts.length > 0 && (
                  <div className="bg-g-honey-soft rounded-[16px] p-[13px] mb-3">
                    <div className="flex items-start gap-[10px] mb-[10px]">
                      <AlertTriangle size={16} className="text-g-honey shrink-0 mt-[2px]" />
                      <div className="font-body text-[13px] leading-[1.45] text-g-ink">
                        {staleFacts.length === 1 ? "This fact" : `${staleFacts.length} facts`} about {baby.name} might be out of date:
                      </div>
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      {staleFacts.map((fact) => (
                        <div key={fact.id} className="bg-g-panel rounded-[9px] py-[8px] px-[11px]">
                          <div className="font-body text-[13px] leading-[1.4] text-g-ink mb-[6px]">{fact.content}</div>
                          <div className="flex gap-[6px]">
                            <button
                              onClick={() => openEdit(fact)}
                              className="flex items-center gap-[4px] font-body text-[11.5px] font-semibold text-g-honey bg-g-panel2 border-none rounded-[7px] py-[5px] px-[8px] cursor-pointer"
                            >
                              <Pencil size={11} />Update
                            </button>
                            <button
                              onClick={() => handleDelete(fact.id)}
                              className="flex items-center gap-[4px] font-body text-[11.5px] font-semibold text-g-honey bg-g-panel2 border-none rounded-[7px] py-[5px] px-[8px] cursor-pointer"
                            >
                              <Trash2 size={11} />Remove
                            </button>
                            <button
                              onClick={() => handlePin(fact.id, false)}
                              className="flex items-center gap-[4px] font-body text-[11.5px] font-semibold text-g-honey bg-g-panel2 border-none rounded-[7px] py-[5px] px-[8px] cursor-pointer"
                            >
                              <Pin size={11} />Still true
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Facts list (topic + global) */}
                {allVisibleFacts.length > 0 && (
                  <div className="flex flex-col gap-[8px] mb-3">
                    {(shouldCollapse ? allVisibleFacts.slice(0, COLLAPSE_THRESHOLD) : allVisibleFacts).map((fact) => {
                      const isGlobal = !fact.topic_id;
                      const stale = !isGlobal && isStale(fact.updated_at, fact.pinned);
                      const expanded = expandedId === fact.id;
                      return (
                        <div key={fact.id}>
                          <button
                            onClick={() => isGlobal ? startTransition(() => router.push("/settings")) : setExpandedId(expanded ? null : fact.id)}
                            className={`w-full text-left border-none rounded-[14px] py-[11px] px-[14px] flex items-start gap-[10px] ${
                              isGlobal ? "bg-g-prim-soft/40 cursor-pointer" : stale ? "bg-g-honey-soft/50 ring-1 ring-g-honey/30 cursor-pointer" : "bg-g-bg cursor-pointer"
                            }`}
                          >
                            <span className="flex-1 font-body text-[13.5px] leading-[1.45] text-g-ink min-w-0">
                              {fact.content}
                            </span>
                            {isGlobal && (
                              <span className="flex items-center gap-[3px] font-body text-[11px] text-g-prim font-semibold shrink-0 mt-[2px]">
                                <Globe size={10} />all topics
                              </span>
                            )}
                            {!isGlobal && fact.pinned && (
                              <Pin size={13} className="text-g-prim shrink-0 mt-[3px] fill-current" />
                            )}
                            {stale && !fact.pinned && (
                              <span className="font-body text-[11px] text-g-honey font-semibold shrink-0 mt-[2px]">stale</span>
                            )}
                          </button>

                          {/* Expanded actions (topic facts only) */}
                          {expanded && !isGlobal && (
                            <div className="flex gap-[8px] mt-[6px] ml-[13px]">
                              <button
                                onClick={() => openEdit(fact)}
                                className="flex items-center gap-[5px] font-body text-[12px] font-semibold text-g-sub bg-g-bg border-none rounded-[8px] py-[6px] px-[10px] cursor-pointer"
                              >
                                <Pencil size={12} />Edit
                              </button>
                              <button
                                onClick={() => handleDelete(fact.id)}
                                className="flex items-center gap-[5px] font-body text-[12px] font-semibold text-g-sub bg-g-bg border-none rounded-[8px] py-[6px] px-[10px] cursor-pointer"
                              >
                                <Trash2 size={12} />Remove
                              </button>
                              <button
                                onClick={() => handlePin(fact.id, fact.pinned)}
                                className="flex items-center gap-[5px] font-body text-[12px] font-semibold text-g-sub bg-g-bg border-none rounded-[8px] py-[6px] px-[10px] cursor-pointer"
                              >
                                <Pin size={12} className={fact.pinned ? "fill-current" : ""} />
                                {fact.pinned ? "Unpin" : "Pin"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {shouldCollapse && (
                      <button
                        onClick={() => setFactsExpanded(true)}
                        className="flex items-center justify-center gap-[5px] font-body text-[12.5px] font-semibold text-g-prim bg-transparent border-none cursor-pointer py-[6px]"
                      >
                        <ChevronDown size={14} />
                        {allVisibleFacts.length - COLLAPSE_THRESHOLD} more
                      </button>
                    )}
                    {factsExpanded && allVisibleFacts.length > COLLAPSE_THRESHOLD && (
                      <button
                        onClick={() => setFactsExpanded(false)}
                        className="flex items-center justify-center gap-[5px] font-body text-[12.5px] font-semibold text-g-faint bg-transparent border-none cursor-pointer py-[4px]"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                )}

                <div className="font-body text-[13.5px] leading-[1.5] text-g-sub mb-3">
                  {topicFacts.length === 0
                    ? `Tell Grounded something that\u2019s true for ${baby.name} right now \u2014 and answers get more relevant.`
                    : `These help Grounded give ${baby.name} more relevant answers.`}
                </div>
                <Button size="sm" variant="soft" icon={Plus} onClick={openAdd}>
                  Add a fact
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Saved answers */}
        {topic.ready && topicPins.length > 0 && (
          <>
            <Kicker className="mb-[12px]">Saved answers</Kicker>
            <div className="g-up flex flex-col gap-[10px] mb-[26px]">
              {topicPins.map((pin) => (
                <div
                  key={pin.id}
                  className="bg-g-panel rounded-[22px] py-[15px] px-[18px] shadow-[var(--g-shadow-sm)]"
                >
                  <Link
                    href={`/chat/${pin.conversation_id}`}
                    className="no-underline block g-tap"
                  >
                    <div className="font-display text-[19px] leading-[1.2] text-g-ink">
                      {pin.question}
                    </div>
                    <div className="font-body text-[13px] leading-[1.4] text-g-sub mt-[5px] line-clamp-1">
                      {pin.content.replace(/^#+\s+/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\n+/g, " ").trim().slice(0, 120)}
                    </div>
                  </Link>
                  <div className="flex items-center justify-between mt-[6px]">
                    <span className="font-body text-[11.5px] text-g-faint">{timeAgo(pin.created_at)}</span>
                    <button
                      onClick={() => handleUnpinAnswer(pin.id)}
                      className="flex items-center gap-[4px] font-body text-[11.5px] font-semibold text-g-faint bg-transparent border-none p-0 cursor-pointer"
                    >
                      <Pin size={11} className="fill-current" />Unpin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sources */}
        <Kicker className="mb-[14px]">On the shelf</Kicker>
        <div className="g-up -mx-5 px-5 overflow-x-auto mb-[18px]" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-[18px] w-max pb-[6px] pr-5">
            {topic.sources.map((s, i) => (
              <div key={i} className="w-[88px] flex flex-col items-start">
                <Cover spine={s.spine} title={s.title} w={88} h={124} />
                <span className="block font-body text-[11.5px] leading-[1.3] text-g-sub mt-[10px]">{s.author}</span>
                {s.amazonUrl ? (
                  <a
                    href={s.amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline mt-2 font-body text-[12px] font-bold text-g-prim bg-g-prim-soft rounded-full py-[5px] px-[13px]"
                  >
                    Buy
                  </a>
                ) : (
                  <span className="mt-2 font-body text-[12px] font-bold text-g-prim bg-g-prim-soft rounded-full py-[5px] px-[13px]">
                    Buy
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        {topic.videos && (() => {
          // Deduplicate by channel name for display
          const seen = new Set<string>();
          const uniqueChannels = topic.videos.filter((v) => {
            if (seen.has(v.channel)) return false;
            seen.add(v.channel);
            return true;
          });
          return (
            <div className="g-up flex flex-col gap-[10px] mb-[18px]">
              {uniqueChannels.map((v, i) => {
                const href = v.url || (v.channelId ? `https://www.youtube.com/channel/${v.channelId}` : `https://www.youtube.com/${v.handle}`);
                return (
                  <div key={i} className="flex gap-[14px] items-center bg-g-panel rounded-[22px] py-[12px] px-[14px] shadow-[var(--g-shadow-sm)]">
                    <span
                      className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-g-ink shrink-0"
                      style={{ background: `var(--g-t-${topic.hue})` }}
                    >
                      <Play size={17} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-display text-[19px] text-g-ink leading-[1.1]">{v.channel}</span>
                      <span className="block font-body text-[12.5px] text-g-faint mt-[3px]">{v.playlistId ? "YouTube playlist" : "YouTube channel"}</span>
                    </span>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline font-body text-[12px] font-bold text-g-prim bg-g-prim-soft rounded-full py-[6px] px-[14px] shrink-0"
                    >
                      Open
                    </a>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <div className="font-body text-[13px] italic text-g-sub mb-[28px] leading-[1.5]">
          {topic.note || "These are the books Grounded draws from for this guide. Consider supporting the authors."}
        </div>

        {/* Helplines */}
        {topic.helplines && topic.helplines.length > 0 && (
          <div className="g-up bg-g-honey-soft rounded-[26px] p-[18px] mb-[28px]">
            <Kicker color="var(--g-honey)" className="mb-1">Need to talk to someone?</Kicker>
            <div className="font-body text-[12.5px] text-g-sub leading-[1.45] mb-3">
              Real people, on the phone, who know this well.
            </div>
            <div className="flex flex-col gap-2">
              {topic.helplines.map((h, i) => (
                <a
                  key={i}
                  href={`tel:${h.tel.replace(/\s/g, "")}`}
                  className="no-underline flex items-center gap-[13px] bg-g-panel rounded-[18px] py-[11px] px-[14px] g-tap"
                >
                  <span className="w-[34px] h-[34px] rounded-full bg-g-honey-soft text-g-honey flex items-center justify-center shrink-0">
                    <Phone size={15} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-body text-[14px] font-semibold text-g-ink leading-[1.3]">{h.name}</span>
                    <span className="block font-body text-[12.5px] text-g-faint mt-[2px]">{h.tel}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Conversations or "Being curated" */}
        {topic.ready ? (
          <>
            <Kicker className="mb-3">Conversations here</Kicker>
            {convos.length === 0 ? (
              <div className="bg-g-panel rounded-[26px] pt-3 pb-5 px-4 text-center shadow-[var(--g-shadow-sm)]">
                <SpotConversations className="w-[150px] h-auto mx-auto" />
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
                    className="w-full no-underline bg-g-panel rounded-[22px] py-[15px] px-[18px] shadow-[var(--g-shadow-sm)] flex justify-between gap-[10px] items-center g-tap"
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-[19px] text-g-ink leading-[1.15]">
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
          <div className="bg-g-panel rounded-[26px] pt-3 pb-6 px-5 shadow-[var(--g-shadow-sm)] text-center">
            <SpotCurating className="w-[190px] h-auto mx-auto" />
            <div className="font-display text-[26px] text-g-ink mb-[6px] mt-1">Being <span className="italic text-g-clay">curated</span></div>
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
            padding: `14px 20px max(calc(env(safe-area-inset-bottom, 0px) + 12px), 24px)`,
          }}
        >
          <Button full icon={Plus} onClick={() => startTransition(() => router.push(`/chat/new?topic=${topic.id}`))}>
            Ask something new
          </Button>
        </div>
      )}

      {/* Add / Edit fact sheet */}
      <Sheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setFactText(""); setEditingId(null); }}
        title={editingId ? "Edit fact" : "Add a fact"}
      >
        <Field
          label={`What\u2019s true for ${baby?.name || "your baby"} right now?`}
          value={factText}
          onChange={(e) => setFactText(e.target.value)}
          placeholder="e.g. Currently cluster feeding in the evenings"
        />
        <div className="mt-4">
          <Button full onClick={handleSave} disabled={!factText.trim() || saving}>
            {saving ? "Saving\u2026" : "Save"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
