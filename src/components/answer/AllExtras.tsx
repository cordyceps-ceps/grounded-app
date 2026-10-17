"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getTopicById, searchableTopics, topicsFromSources, type Topic } from "@/lib/topics";

export interface NoteForAll {
  topic_id: string | null;
  content: string;
}

/** One quiet line saying how wide the search was and where the answer came from. */
export function SearchedLine({ sources }: { sources: string[] }) {
  const all = searchableTopics();
  const drew = topicsFromSources(sources);
  return (
    <div className="mt-[18px] flex items-start gap-[9px] font-body text-[13px] leading-[1.45] text-g-sub">
      <span className="flex shrink-0 mt-[3px]">
        {all.map((t, i) => (
          <span
            key={t.id}
            className="w-[12px] h-[12px] rounded-full border-2 border-g-bg"
            style={{
              background: `var(--g-t-${t.hue})`,
              marginLeft: i ? -4 : 0,
              opacity: drew.length === 0 || drew.includes(t) ? 1 : 0.35,
            }}
          />
        ))}
      </span>
      <span>
        Searched all {all.length} guides
        {drew.length > 0 && (
          <>
            , found this in <strong className="font-semibold text-g-ink">{drew.map((t) => t.name).join(" and ")}</strong>
          </>
        )}
        .
      </span>
    </div>
  );
}

/** Jump from a quick cross-topic answer into the topic guide, carrying the question. */
export function GoDeeper({ sources, onPick }: { sources: string[]; onPick: (topic: Topic) => void }) {
  const drew = topicsFromSources(sources);
  if (drew.length === 0) return null;
  return (
    <div className="mt-[14px] flex flex-wrap gap-[8px]">
      {drew.map((t) => (
        <button
          key={t.id}
          onClick={() => onPick(t)}
          className="flex items-center gap-[7px] font-body text-[13px] font-semibold text-g-ink border-none rounded-full py-[9px] pl-[11px] pr-[13px] cursor-pointer"
          style={{ background: `var(--g-t-${t.hue})` }}
        >
          Go deeper in {t.name}
          <ChevronRight size={14} />
        </button>
      ))}
    </div>
  );
}

/** Collapsed pill that shows which of the family's notes ride along with an "all" question. */
export function NotesInUse({ notes, babyName }: { notes: NoteForAll[]; babyName?: string }) {
  const [open, setOpen] = useState(false);
  if (notes.length === 0) return null;

  const groups = new Map<string, string[]>();
  for (const n of notes) {
    const key = n.topic_id || "";
    groups.set(key, [...(groups.get(key) || []), n.content]);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : 0));

  return (
    <div className="mx-5 mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-[7px] bg-transparent border-none cursor-pointer p-0 font-body text-[12.5px] font-semibold text-g-sub"
      >
        Using {notes.length} {notes.length === 1 ? "note" : "notes"}{babyName ? ` about ${babyName}` : ""}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="g-up mt-[8px] bg-g-panel rounded-[18px] p-[14px] shadow-[var(--g-shadow-sm)] flex flex-col gap-[11px]">
          {ordered.map(([topicId, items]) => {
            const topic = topicId ? getTopicById(topicId) : undefined;
            return (
              <div key={topicId || "general"}>
                <div className="flex items-center gap-[7px] mb-[5px] font-body text-[11px] font-bold tracking-[1px] uppercase text-g-faint">
                  <span
                    className="w-[9px] h-[9px] rounded-full"
                    style={{ background: topic ? `var(--g-t-${topic.hue})` : "var(--g-ill-mid)" }}
                  />
                  {topic ? topic.name : "General"}
                </div>
                {items.map((c, i) => (
                  <div key={i} className="font-body text-[13.5px] text-g-ink leading-[1.4]">{c}</div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
