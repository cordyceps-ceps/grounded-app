"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Link2, ChevronRight } from "lucide-react";
import { TopBar } from "@/components/ui";

export default function ChoosePage() {
  const router = useRouter();

  const Card = ({
    icon: Icon,
    title,
    sub,
    onClick,
  }: {
    icon: typeof Sparkles;
    title: string;
    sub: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="text-left cursor-pointer bg-g-panel border-none rounded-[20px] p-5 shadow-[var(--g-shadow)] flex gap-[15px] items-center w-full"
    >
      <span className="w-12 h-12 rounded-[16px] bg-g-prim-soft text-g-prim flex items-center justify-center shrink-0">
        <Icon size={24} />
      </span>
      <span className="flex-1">
        <span className="block font-display text-[24px] text-g-ink leading-[1]">{title}</span>
        <span className="block font-body text-[13.5px] text-g-sub mt-[5px] leading-[1.4]">{sub}</span>
      </span>
      <span className="text-g-faint">
        <ChevronRight size={18} />
      </span>
    </button>
  );

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar onBack={() => router.push("/onboarding/account")} />

      <div className="flex-1 overflow-y-auto px-6 py-[6px] flex flex-col">
        <div className="font-display text-[34px] leading-[1.05] text-g-ink mb-2">
          Setting up for the first time, or joining a partner?
        </div>
        <div className="font-body text-[14.5px] text-g-sub mb-7 leading-[1.5]">
          Either way, you&rsquo;ll share one family space.
        </div>

        <div className="flex flex-col gap-[14px]">
          <Card
            icon={Sparkles}
            title="Starting fresh"
            sub="Create a new family and set up your baby&rsquo;s profile."
            onClick={() => router.push("/onboarding/profile")}
          />
          <Card
            icon={Link2}
            title="Joining my partner"
            sub="You&rsquo;ve been invited — link to their family space."
            onClick={() => router.push("/onboarding/join")}
          />
        </div>
      </div>
    </div>
  );
}
