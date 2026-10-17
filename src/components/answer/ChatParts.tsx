import { ChevronRight } from "lucide-react";
import { BrandMark, MoonLoader, SpotConversations, TopicArt } from "@/components/illustrations";
import { Kicker } from "@/components/ui";
import type { Topic } from "@/lib/topics";

export function TopicStrip({ topic }: { topic: Topic }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden mx-5 mb-2 rounded-[22px] h-[64px] flex items-center px-[18px] text-g-ink"
      style={{ background: `var(--g-t-${topic.hue})` }}
    >
      <div>
        <div className="font-body text-[11px] font-bold tracking-[1px] uppercase opacity-60">
          Asking the books
        </div>
        <div className="font-display text-[23px] leading-[1.05]">{topic.name}</div>
      </div>
      <TopicArt
        topicId={topic.id}
        width={84}
        height={84}
        className="absolute -right-2 -bottom-4"
      />
    </div>
  );
}

export function UserBubble({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end mb-[24px]">
      <Kicker className="mb-[6px] mr-1">{name}</Kicker>
      <div className="max-w-[86%] bg-g-prim text-g-on-prim rounded-[24px] rounded-br-[8px] py-[14px] px-[19px] font-body text-[15.5px] leading-[1.45]">
        {children}
      </div>
    </div>
  );
}

export function AssistantHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[9px] mb-[14px]">
      <BrandMark size={26} />
      <span className="font-display text-[20px] text-g-ink">Grounded</span>
      {children}
    </div>
  );
}

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-[10px] py-1" role="status">
      <MoonLoader size={44} />
      <span className="font-display italic text-[19px] text-g-sub">Reading the books&hellip;</span>
    </div>
  );
}

export function SuggestionCard({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left cursor-pointer bg-g-panel border-none rounded-[20px] py-[16px] px-[19px] font-display text-[20px] text-g-ink leading-[1.15] shadow-[var(--g-shadow-sm)] g-tap"
    >
      {children}
    </button>
  );
}

export function EmptyIntro({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">{children}</div>
      <SpotConversations width={92} height={74} className="shrink-0 mb-2" />
    </div>
  );
}

export function FollowUpButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-[10px] text-left font-display text-[17px] text-g-ink bg-g-panel border-none rounded-[18px] py-[12px] px-[16px] cursor-pointer leading-[1.2] shadow-[var(--g-shadow-sm)]"
    >
      <span className="flex-1">{children}</span>
      <ChevronRight size={16} className="shrink-0 text-g-clay" />
    </button>
  );
}
