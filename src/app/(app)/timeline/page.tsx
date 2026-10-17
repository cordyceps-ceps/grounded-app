"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, Check, ChevronRight } from "lucide-react";
import { TopBar, Kicker, Cover, IconBtn, Avatar } from "@/components/ui";
import { SpotTimeline } from "@/components/illustrations";
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@/components/UserProvider";
import { PERIODS, WBW_BOOK, MS_CATS, getCurrentPeriod } from "@/lib/milestones";

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

export default function TimelinePage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { baby } = useUser();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLDivElement>(null);

  const currentPeriod = baby?.dob ? getCurrentPeriod(baby.dob) : null;
  const curIndex = currentPeriod ? PERIODS.findIndex((p) => p.id === currentPeriod.id) : -1;

  useEffect(() => {
    const s = scrollerRef.current;
    const c = curRef.current;
    if (s && c) s.scrollTop = Math.max(0, c.offsetTop - 12);
  }, []);

  return (
    <div className="fixed inset-0 bg-g-bg flex flex-col">
      <TopBar
        onBack={() => startTransition(() => router.push("/home"))}
        title="Week by week"
        right={<div className="flex gap-[9px] items-center"><DarkToggle /><Avatar /></div>}
      />

      <div ref={scrollerRef} className="flex-1 overflow-y-auto" style={{ padding: "2px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <div className="g-up pb-[22px]">
          <div
            className="relative overflow-hidden rounded-[28px] text-g-ink"
            style={{ background: "var(--g-t-sage)", padding: "22px 22px 20px", minHeight: 170 }}
          >
            <div className="relative z-10 max-w-[64%]">
              <div className="font-body text-[11px] font-bold tracking-[1px] uppercase opacity-65 mb-[10px]">Week by week</div>
              <div className="font-display text-[32px] leading-[1.03] mb-2">
                {baby?.name ? <>{baby.name}&rsquo;s weeks, <span className="italic text-g-prim">one by one</span></> : "Week by week"}
              </div>
              <div className="font-body text-[13px] opacity-80 leading-[1.45]">
                {baby?.age ? `${baby.name} is ${baby.age} old. Scroll back for what\u2019s been, forward for what\u2019s coming.` : "Scroll back for what\u2019s been, forward for what\u2019s coming."}
              </div>
            </div>
            <SpotTimeline className="absolute -right-5 -bottom-3 w-[170px] h-auto" />
          </div>
          <div className="flex items-center gap-3 mt-3 bg-g-panel rounded-[22px] py-[12px] px-[14px] shadow-[var(--g-shadow-sm)]">
            <Cover spine={WBW_BOOK.spine} w={34} h={48} />
            <span className="flex-1 min-w-0">
              <span className="block font-display text-[18px] leading-[1.1] text-g-ink whitespace-nowrap overflow-hidden text-ellipsis">{WBW_BOOK.title}</span>
              <span className="block font-body text-[12px] text-g-faint mt-[2px]">{WBW_BOOK.author}</span>
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute bg-g-line rounded-full" style={{ left: 11, top: 10, bottom: 10, width: 2 }} />
          {PERIODS.map((p, i) => {
            const isCur = p.id === currentPeriod?.id;
            const isPast = curIndex >= 0 && i < curIndex;
            return (
              <div key={p.id} ref={isCur ? curRef : undefined} className="relative" style={{ paddingLeft: 34, paddingBottom: 24 }}>
                <span
                  className="absolute flex items-center justify-center rounded-full text-g-on-prim"
                  style={{
                    left: isCur ? 2 : 5,
                    top: isCur ? 3 : 6,
                    width: isCur ? 20 : 14,
                    height: isCur ? 20 : 14,
                    background: isCur ? "var(--g-prim)" : isPast ? "var(--g-t-sage)" : "var(--g-bg)",
                    border: isCur ? "none" : isPast ? "2px solid var(--g-t-sage)" : "2px solid var(--g-line)",
                    boxShadow: isCur ? "0 0 0 4px var(--g-prim-soft)" : "none",
                  }}
                >
                  {isCur && <Check size={11} />}
                </span>
                <div className="flex items-baseline gap-[9px] mb-[9px]" style={{ minHeight: 22 }}>
                  <span className="font-display text-[24px] leading-none" style={{ color: isCur ? "var(--g-prim)" : "var(--g-ink)" }}>{p.label}</span>
                  <span className="font-body text-[12px] text-g-faint">{p.sub}</span>
                  {isCur && (
                    <span className="font-body text-[10px] font-bold tracking-[0.6px] uppercase text-g-on-prim bg-g-prim rounded-full py-[3px] px-[9px]">
                      Now
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {p.items.map((it) => {
                    const cat = MS_CATS[it.cat];
                    const Icon = cat.icon;
                    return (
                      <button
                        key={it.id}
                        onClick={() => startTransition(() => router.push(`/timeline/milestone/${it.id}`))}
                        className="w-full text-left cursor-pointer bg-g-panel rounded-[22px] py-[13px] px-[14px] shadow-[var(--g-shadow-sm)] flex gap-3 items-center"
                        style={isCur ? { border: "1.5px solid var(--g-prim-soft)" } : { border: "none" }}
                      >
                        <span
                          className="rounded-full flex items-center justify-center shrink-0"
                          style={{ width: 34, height: 34, background: cat.soft, color: cat.fg }}
                        >
                          <Icon size={17} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-body text-[14.5px] font-bold text-g-ink leading-[1.25]">{it.title}</span>
                          <span className="block font-body text-[12px] text-g-faint mt-[2px]">{it.range}</span>
                        </span>
                        <span className="text-g-faint shrink-0"><ChevronRight size={15} /></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="relative" style={{ paddingLeft: 34 }}>
            <span
              className="absolute rounded-full"
              style={{ left: 5, top: 4, width: 14, height: 14, background: "var(--g-bg)", border: "2px solid var(--g-line)" }}
            />
            <div className="font-body text-[13px] text-g-faint leading-[1.5]">
              {"That\u2019s what the book covers so far. More guides open as "}{baby?.name || "your baby"}{" grows."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
