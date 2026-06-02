"use client";

import { useRouter } from "next/navigation";
import { Book, Leaf, Users } from "lucide-react";
import { Button, Cover } from "@/components/ui";
import { TOPICS } from "@/lib/topics";

const POINTS = [
  { icon: Book, title: "Answers from a few trusted books", sub: "Never the open internet, never a guess." },
  { icon: Leaf, title: "Warm, plain, and to the point", sub: "Like a knowledgeable friend at the kitchen table." },
  { icon: Users, title: "Shared with your partner", sub: "One family space, so you\u2019re never out of the loop." },
];

export default function WelcomePage() {
  const router = useRouter();
  const bfSources = TOPICS.find((t) => t.id === "bf")?.sources ?? [];

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 24px 16px" }}
      >
        {/* Book spines */}
        <div className="g-up flex gap-[7px] mb-[30px]">
          {bfSources.map((s, i) => (
            <Cover key={i} spine={s.spine} w={46} h={64} />
          ))}
        </div>

        {/* Logo */}
        <div className="g-up flex items-center gap-[9px] mb-[18px]">
          <div className="w-[30px] h-[30px] rounded-[15px] bg-g-prim text-g-on-prim flex items-center justify-center">
            <Leaf size={16} />
          </div>
          <span className="font-display text-[26px] text-g-ink">Grounded</span>
        </div>

        {/* Headline */}
        <div className="g-up font-display text-[40px] leading-[1.04] text-g-ink mb-[14px]">
          A calm place to ask — grounded in books you{" "}
          <span className="italic text-g-prim">trust</span>.
        </div>

        {/* Feature points */}
        <div className="g-up flex flex-col gap-4 mt-[26px]">
          {POINTS.map(({ icon: Icon, title, sub }, i) => (
            <div key={i} className="flex gap-[13px] items-start">
              <span className="w-[38px] h-[38px] rounded-[12px] bg-g-prim-soft text-g-prim flex items-center justify-center shrink-0">
                <Icon size={19} />
              </span>
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
      </div>
    </div>
  );
}
