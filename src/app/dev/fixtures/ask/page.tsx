"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Pin, Mic, ArrowUp, Sun } from "lucide-react";
import { TopBar, IconBtn, Kicker } from "@/components/ui";
import { parseAnswer, extractSources } from "@/lib/parseAnswer";
import { AnswerBlocks } from "@/components/answer/AnswerBlocks";
import { SourcesRow } from "@/components/answer/SourcesRow";
import { SearchedLine, GoDeeper, NotesInUse } from "@/components/answer/AllExtras";
import {
  AllStrip, UserBubble, AssistantHeader, SuggestionCard, EmptyIntro, FollowUpButton,
} from "@/components/answer/ChatParts";
import { useUser } from "@/components/UserProvider";

const SAMPLE = `Frequent night waking at this age is usually a mix of hunger and immature sleep cycles, so it is worth looking at both. Weissbluth explains that babies this young cycle through light sleep often and need help linking cycles, while Huggins points out that night feeds are still doing real work for supply and growth.

## What is likely going on

Feeding every two to three hours overnight is **within the normal range** for a baby this age, particularly if she is breastfed. It tends to space out gradually without you doing anything.

1. Keep night feeds dark, quiet and brief, so waking stays boring.
2. Try an earlier bedtime if she is overtired by evening. Weissbluth suggests the early window is easy to miss.
3. Offer a full feed before your own bedtime rather than waiting for the first cry.

## When to ask someone

If she is not gaining weight, or is feeding constantly with few wet nappies, speak to your health visitor or GP.
`;

function Inner() {
  const params = useSearchParams();
  const empty = params.get("empty") === "1";
  const { me, baby, facts } = useUser();
  const blocks = parseAnswer(SAMPLE);
  const sources = extractSources(SAMPLE, "all");
  const noop = () => {};
  const suggestions = [
    "Is it normal for her to feed this often at night?",
    "How long should naps be at this age?",
    "What can I do about the evening fussiness?",
  ];

  return (
    <div className="bg-g-bg min-h-[100dvh] flex flex-col">
      <TopBar onBack={noop} title={empty ? undefined : "Ask anything"} right={<IconBtn icon={Sun} label="Toggle night mode" onClick={noop} />} />
      <AllStrip />
      <NotesInUse notes={facts} babyName={baby?.name} />

      <div className="px-5 py-3 flex-1">
        {empty ? (
          <div className="pt-4">
            <EmptyIntro>
              <div className="font-display text-[38px] leading-[1.02] text-g-ink mb-3">
                What&rsquo;s on your <em>mind</em>?
              </div>
              <div className="font-body text-[15px] leading-[1.55] text-g-sub mb-[26px]">
                I&rsquo;ll look across every guide for the best answer, with {baby?.name} in mind. Type it, or tap the mic.
              </div>
            </EmptyIntro>
            <Kicker className="mb-[13px]">Maybe start with</Kicker>
            <div className="flex flex-col gap-[10px]">
              {suggestions.map((s) => (
                <SuggestionCard key={s} onClick={noop}>{s}</SuggestionCard>
              ))}
            </div>
          </div>
        ) : (
          <>
            <UserBubble name={me}>Why is she waking so much at night?</UserBubble>
            <div className="mb-[26px]">
              <AssistantHeader />
              <AnswerBlocks blocks={blocks} />
              <SearchedLine sources={sources} />
              <SourcesRow sources={sources} topicId="all" />
              <GoDeeper sources={sources} onPick={noop} />
              <div className="flex gap-[9px] mt-[16px] mb-4">
                <button className="flex items-center gap-[5px] font-body text-[12.5px] font-semibold text-g-sub bg-g-panel border-none rounded-full py-2 px-[14px] shadow-[var(--g-shadow-sm)]">
                  <Copy size={14} />Copy
                </button>
                <button className="flex items-center gap-[5px] font-body text-[12.5px] font-semibold text-g-sub bg-g-panel border-none rounded-full py-2 px-[14px] shadow-[var(--g-shadow-sm)]">
                  <Pin size={14} />Pin answer
                </button>
              </div>
              <div className="mt-4 mb-2">
                <Kicker className="mb-[10px]">You might also ask</Kicker>
                <div className="flex flex-col gap-[7px]">
                  <FollowUpButton onClick={noop}>Should I wake her for a dream feed?</FollowUpButton>
                  <FollowUpButton onClick={noop}>What is a sensible bedtime for 11 weeks?</FollowUpButton>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 bg-g-bg" style={{ padding: "11px 18px 16px" }}>
        <div className="flex items-end gap-[9px] bg-g-panel rounded-full py-[7px] pl-[22px] pr-[7px] shadow-[var(--g-shadow)] border border-g-line">
          <span className="flex-1 font-body text-[15px] text-g-faint py-[9px]">{empty ? "Type your question…" : "Ask a follow-up…"}</span>
          <span className="w-10 h-10 rounded-full flex items-center justify-center bg-g-prim-soft text-g-prim"><Mic size={18} /></span>
          <span className="hidden"><ArrowUp size={18} /></span>
        </div>
      </div>
    </div>
  );
}

export default function AskFixture() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
