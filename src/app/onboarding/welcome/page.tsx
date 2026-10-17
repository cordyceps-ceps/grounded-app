"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { BrandMark, SceneTogether } from "@/components/illustrations";
import { SceneFrame } from "@/components/illustrations/SceneFrame";

const POINTS = [
  { title: "Answers from a few trusted books", sub: "Never the open internet, never a guess." },
  { title: "Warm, plain, and to the point", sub: "Like a knowledgeable friend at the kitchen table." },
  { title: "Shared with your partner", sub: "One family space, so you\u2019re never out of the loop." },
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 24px 16px" }}
      >
        {/* Hero scene */}
        <SceneFrame className="g-up mb-[26px]">
          <SceneTogether width="100%" height="100%" />
        </SceneFrame>

        {/* Logo */}
        <div className="g-up flex items-center gap-[10px] mb-[14px]">
          <BrandMark size={32} />
          <span className="font-display text-[26px] text-g-ink">Grounded</span>
        </div>

        {/* Headline */}
        <div className="g-up font-display text-[40px] leading-[1.04] text-g-ink mb-[14px]">
          A calm place to ask — grounded in books you{" "}
          <span className="italic text-g-prim">trust</span>.
        </div>

        {/* Feature points */}
        <div className="g-up flex flex-col gap-4 mt-[22px]">
          {POINTS.map(({ title, sub }, i) => (
            <div key={i} className="flex gap-[13px] items-start">
              <span className="font-display italic text-[22px] leading-[1.1] text-g-clay w-[22px] shrink-0">{i + 1}</span>
              <div className="min-w-0">
                <div className="font-body text-[15.5px] font-bold text-g-ink leading-[1.3]">{title}</div>
                <div className="font-body text-[13.5px] text-g-sub mt-[2px] leading-[1.4]">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div
        className="shrink-0 bg-g-bg"
        style={{ padding: "12px 24px calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <Button full arrow onClick={() => router.push("/onboarding/account")}>
          Get started
        </Button>
        <button
          onClick={() => router.push("/onboarding/join")}
          className="w-full mt-3 bg-transparent border-none cursor-pointer font-body text-[14.5px] font-semibold text-g-sub"
        >
          I have an invite from my partner
        </button>

        <div className="w-10 h-px bg-g-line mx-auto my-4" />

        <button
          onClick={() => router.push("/onboarding/account?mode=login")}
          className="w-full bg-transparent border-none cursor-pointer font-body text-[13.5px] text-g-prim"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}
