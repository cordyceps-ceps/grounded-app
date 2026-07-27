"use client";

import { useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { Clock, Leaf } from "lucide-react";
import { TopBar, Kicker, Cover, Button } from "@/components/ui";
import { useUser } from "@/components/UserProvider";
import { findMilestone, WBW_BOOK, MS_CATS } from "@/lib/milestones";

export default function MilestoneDetailPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const params = useParams();
  const { baby } = useUser();

  const found = findMilestone(params.id as string);

  if (!found) {
    return (
      <div className="fixed inset-0 bg-g-bg flex flex-col">
        <TopBar onBack={() => startTransition(() => router.push("/timeline"))} />
      </div>
    );
  }

  const { milestone, period } = found;
  const cat = MS_CATS[milestone.cat];
  const CatIcon = cat.icon;

  const askAbout = () => {
    const question = `Tell me more about ${milestone.title.toLowerCase()} — what should I expect${baby?.name ? ` with ${baby.name}` : ""}?`;
    startTransition(() => router.push(`/chat/new?topic=wbw&prefill=${encodeURIComponent(question)}`));
  };

  return (
    <div className="fixed inset-0 bg-g-bg flex flex-col">
      <TopBar onBack={() => startTransition(() => router.push("/timeline"))} title={period.label} />

      <div className="flex-1 overflow-y-auto" style={{ padding: "2px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <div className="g-up">
          <span
            className="inline-flex items-center gap-[5px] rounded-[8px] py-[5px] px-[9px] font-body text-[11.5px] font-bold tracking-[0.4px] uppercase mb-3"
            style={{ background: cat.soft, color: cat.fg }}
          >
            <CatIcon size={12} />
            {cat.label}
          </span>
          <div className="font-display text-[36px] leading-[1.03] text-g-ink mb-[10px]">{milestone.title}</div>
          <div className="inline-flex items-center gap-[7px] bg-g-panel2 rounded-[10px] py-2 px-3 mb-6">
            <span className="text-g-faint flex"><Clock size={15} /></span>
            <span className="font-body text-[13px] font-semibold text-g-ink">Usually {milestone.range}</span>
          </div>
        </div>

        <div className="g-up mb-6">
          <Kicker className="mb-[11px]">What you might notice</Kicker>
          <div className="flex flex-col gap-[10px]">
            {milestone.notice.map((n, i) => (
              <div key={i} className="flex gap-[11px] items-start">
                <span className="rounded-full shrink-0" style={{ marginTop: 6, width: 6, height: 6, background: cat.fg }} />
                <span className="font-body text-[14.5px] leading-[1.5] text-g-ink">{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="g-up bg-g-panel rounded-[18px] p-[18px] shadow-[var(--g-shadow-sm)] mb-5">
          <div className="flex items-center gap-[10px] mb-3">
            <Cover spine={WBW_BOOK.spine} w={26} h={36} />
            <span className="min-w-0">
              <Kicker color="var(--g-prim)">From the book</Kicker>
              <span className="block font-body text-[12.5px] text-g-faint mt-[3px]">{WBW_BOOK.title}</span>
            </span>
          </div>
          <div className="font-display text-[19px] leading-[1.45] text-g-ink">{milestone.excerpt}</div>
        </div>

        <div className="g-up mb-[22px]">
          <Button full arrow onClick={askAbout}>Ask Grounded about this</Button>
        </div>

        <div className="g-up bg-g-honey-soft rounded-[16px] p-4 flex gap-[11px]">
          <span className="text-g-honey shrink-0" style={{ marginTop: 1 }}><Leaf size={18} /></span>
          <div className="font-body text-[13.5px] leading-[1.5] text-g-ink">
            These are ranges, not deadlines. Every baby arrives at things in their own order and their own time — if something&rsquo;s worrying you, your health visitor or GP is the right person to ask.
          </div>
        </div>
      </div>
    </div>
  );
}
