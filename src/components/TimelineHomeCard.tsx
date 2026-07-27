"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Kicker } from "@/components/ui";
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
      className="g-up g-tap w-full text-left cursor-pointer bg-g-panel border-none rounded-[20px] p-[18px] shadow-[var(--g-shadow)] block mb-[26px]"
    >
      <div className="flex items-center justify-between mb-[10px]">
        <Kicker color="var(--g-prim)">This week</Kicker>
        <span className="text-g-faint flex">
          <ChevronRight size={16} />
        </span>
      </div>
      <div className="font-display text-[26px] text-g-ink leading-[1.05] mb-[3px]">
        {period.label} <span className="text-g-faint">· {period.sub}</span>
      </div>
      <div className="font-body text-[13px] text-g-sub mb-[13px]">
        What you might notice with {baby.name} around now.
      </div>
      <div className="flex flex-wrap gap-[7px]">
        {period.items.slice(0, 3).map((it) => {
          const cat = MS_CATS[it.cat];
          const Icon = cat.icon;
          return (
            <span
              key={it.id}
              className="inline-flex items-center gap-[6px] bg-g-panel2 rounded-[9px] py-[7px] px-[10px] font-body text-[12.5px] font-semibold text-g-ink"
            >
              <span style={{ color: cat.fg }} className="flex">
                <Icon size={13} />
              </span>
              {it.title}
            </span>
          );
        })}
      </div>
    </button>
  );
}
