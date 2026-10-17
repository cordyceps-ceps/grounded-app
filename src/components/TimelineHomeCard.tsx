"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Kicker } from "@/components/ui";
import { SpotTimeline } from "@/components/illustrations";
import { useUser } from "@/components/UserProvider";
import { getCurrentPeriod, MS_CATS } from "@/lib/milestones";

export function TimelineHomeCard() {
  const router = useRouter();
  const { baby } = useUser();

  if (!baby || !baby.born || !baby.dob) return null;

  const period = getCurrentPeriod(baby.dob);

  return (
    <button
      onClick={() => router.push("/timeline")}
      className="g-up g-tap relative overflow-hidden w-full text-left cursor-pointer bg-g-panel border-none rounded-[26px] p-[18px] shadow-[var(--g-shadow-sm)] block mb-[26px]"
    >
      <span
        className="absolute right-0 top-0 w-[128px] h-[112px] rounded-bl-[44px] flex items-center justify-center"
        style={{ background: "var(--g-t-sage)" }}
      >
        <SpotTimeline className="w-[112px] h-auto" />
      </span>
      <div className="mb-[10px]">
        <Kicker color="var(--g-prim)">This week</Kicker>
      </div>
      <div className="font-display text-[26px] pr-[120px] text-g-ink leading-[1.05] mb-[3px]">
        {period.label} <span className="text-g-faint">· {period.sub}</span>
      </div>
      <div className="font-body text-[13px] text-g-sub mb-[13px] pr-[120px] min-h-[34px]">
        What you might notice with {baby.name} around now.
      </div>
      <div className="flex flex-wrap gap-[7px] items-center">
        {period.items.slice(0, 3).map((it) => {
          const cat = MS_CATS[it.cat];
          const Icon = cat.icon;
          return (
            <span
              key={it.id}
              className="inline-flex items-center gap-[6px] bg-g-panel2 rounded-full py-[7px] px-[10px] font-body text-[12.5px] font-semibold text-g-ink"
            >
              <span style={{ color: cat.fg }} className="flex">
                <Icon size={13} />
              </span>
              {it.title}
            </span>
          );
        })}
        <span className="text-g-faint flex ml-auto"><ChevronRight size={16} /></span>
      </div>
    </button>
  );
}
