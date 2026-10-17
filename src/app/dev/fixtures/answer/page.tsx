"use client";

import { Copy, Pin, Mic, ArrowUp, Sun } from "lucide-react";
import { TopBar, IconBtn } from "@/components/ui";
import { getTopicById } from "@/lib/topics";
import { parseAnswer, extractSources } from "@/lib/parseAnswer";
import { AnswerBlocks } from "@/components/answer/AnswerBlocks";
import { SourcesRow } from "@/components/answer/SourcesRow";
import {
  TopicStrip, UserBubble, AssistantHeader, ThinkingIndicator,
  SuggestionCard, EmptyIntro, FollowUpButton,
} from "@/components/answer/ChatParts";

const SAMPLE = `Cluster feeding is very common in the first weeks, and in the evenings it is usually a sign that things are working rather than failing. Huggins describes it as a baby bunching feeds together, then sleeping longer afterwards.

## What it usually looks like

Babies often want to feed every 30 to 60 minutes for a few hours. **This is normal**, and it tends to peak around two to three weeks and again around growth spurts.

1. Offer the breast whenever baby shows early cues, even if it feels too soon.
2. Switch sides when the swallowing slows, then come back to the first side.
3. Keep water, a snack and a charger within reach before you settle in.

## What to watch for

- Plenty of wet and dirty nappies across the day
- Baby settles and seems content between feeds
- Weight gain is on track at weigh-ins

Mohrbacher notes that growth spurts and cluster feeding together can feel relentless but rarely mean low supply.
`;

const blocksFromSample = () => {
  const b = parseAnswer(SAMPLE);
  return b;
};

export default function AnswerFixture() {
  const topic = getTopicById("bf")!;
  const blocks = blocksFromSample();
  // Ensure a callout is shown even if the parser has no marker syntax for it.
  if (!blocks.some((x) => x.type === "callout")) {
    blocks.push({
      type: "callout",
      text: "If you are feeling overwhelmed, in pain, or worried baby is not getting enough, please talk to someone today.",
      resource: { name: "National Breastfeeding Helpline", tel: "0300 100 0212" },
    });
  }
  const sources = extractSources(SAMPLE, "bf");
  const noop = () => {};

  return (
    <div className="bg-g-bg min-h-[100dvh] flex flex-col">
      <TopBar onBack={noop} title={topic.name} right={<IconBtn icon={Sun} label="Toggle night mode" onClick={noop} />} />
      <TopicStrip topic={topic} />

      <div className="px-5 py-3">
        <UserBubble name="Tess">Is cluster feeding normal in the evenings?</UserBubble>

        <div className="mb-[26px]">
          <AssistantHeader />
          <AnswerBlocks blocks={blocks} />
          <SourcesRow sources={sources.length ? sources : ["Kathleen Huggins", "Nancy Mohrbacher"]} topicId="bf" />
          <div className="flex gap-[9px] mt-[14px] mb-4">
            <button className="flex items-center gap-[5px] font-body text-[12.5px] font-semibold text-g-sub bg-g-panel border-none rounded-full py-2 px-[14px] shadow-[var(--g-shadow-sm)]">
              <Copy size={14} />Copy
            </button>
            <button className="flex items-center gap-[5px] font-body text-[12.5px] font-semibold border-none rounded-full py-2 px-[14px] shadow-[var(--g-shadow-sm)] bg-g-prim-soft text-g-prim">
              <Pin size={14} className="fill-current" />Pinned
            </button>
          </div>
          <div className="mt-4 mb-2">
            <div className="font-body text-[11.5px] font-bold tracking-[1px] uppercase text-g-faint mb-[10px]">You might also ask</div>
            <div className="flex flex-col gap-[7px]">
              <FollowUpButton onClick={noop}>How long does the evening cluster last?</FollowUpButton>
              <FollowUpButton onClick={noop}>Should I top up with formula?</FollowUpButton>
            </div>
          </div>
        </div>

        <UserBubble name="Tess">And what about at night?</UserBubble>
        <AssistantHeader />
        <ThinkingIndicator />

        <div className="mt-10 pt-6 border-t border-g-line">
          <EmptyIntro>
            <div className="font-display text-[38px] leading-[1.02] text-g-ink mb-3">
              What&rsquo;s on your <em>mind</em>?
            </div>
            <div className="font-body text-[15px] leading-[1.55] text-g-sub mb-[26px]">
              I&rsquo;ll answer from the 4 books on the shelf, with Robin in mind. Type it, or tap the mic.
            </div>
          </EmptyIntro>
          <div className="flex flex-col gap-[10px]">
            <SuggestionCard onClick={noop}>Is cluster feeding normal in the evenings?</SuggestionCard>
            <SuggestionCard onClick={noop}>How do I get a deeper, comfier latch?</SuggestionCard>
          </div>
        </div>
      </div>

      <div className="mt-auto px-[18px] pb-4 pt-3 sticky bottom-0 bg-g-bg">
        <div className="flex items-end gap-[9px] bg-g-panel rounded-full py-[7px] pl-[22px] pr-[7px] shadow-[var(--g-shadow)] border border-g-line">
          <div className="flex-1 font-body text-[15px] text-g-faint py-[9px]">Ask a follow-up&hellip;</div>
          <span className="w-10 h-10 rounded-full flex items-center justify-center bg-g-prim-soft text-g-prim"><Mic size={18} /></span>
          <span className="w-10 h-10 rounded-full flex items-center justify-center bg-g-prim text-g-on-prim"><ArrowUp size={18} /></span>
        </div>
      </div>
    </div>
  );
}
