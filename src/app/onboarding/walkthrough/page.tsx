"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar, Button, Kicker, Dots } from "@/components/ui";
import { SceneBooks, SceneBaby, SceneQuestion } from "@/components/illustrations";
import { SceneFrame } from "@/components/illustrations/SceneFrame";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  {
    Scene: SceneBooks,
    title: "The sources are always visible",
    sub: "Every topic lists the exact books behind its answers. Tap any to see them — or buy a copy.",
  },
  {
    Scene: SceneBaby,
    title: "Your context comes along",
    sub: "Grounded quietly knows your baby\u2019s age and the facts you save, so answers fit your situation.",
  },
  {
    Scene: SceneQuestion,
    title: "One question per conversation",
    sub: "Start a fresh conversation for each new question — it keeps answers focused and clear.",
  },
];

export default function WalkthroughPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("user_profiles")
          .update({ onboarding_complete: true })
          .eq("id", user.id);
      }
    } catch {
      // Continue anyway — worst case they see onboarding again
    }

    router.push("/home");
  };

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar
        onBack={() => router.push("/onboarding/facts")}
        right={<Dots total={3} current={2} />}
      />

      <div className="flex-1 overflow-y-auto px-6 py-[6px]">
        <Kicker className="mb-[10px]">Before you dive in</Kicker>
        <div className="font-display text-[34px] leading-[1.05] text-g-ink mb-6">
          Three things worth knowing
        </div>

        <div className="flex flex-col gap-4 pb-4">
          {STEPS.map(({ Scene, title, sub }, i) => (
            <div
              key={i}
              className="g-up bg-g-panel rounded-[28px] p-[10px] pb-[18px] shadow-[var(--g-shadow-sm)]"
            >
              <SceneFrame className="!shadow-none !rounded-[20px]">
                <Scene width="100%" height="100%" />
              </SceneFrame>
              <div className="px-[10px] pt-[14px]">
                <div className="font-display italic text-[15px] text-g-clay leading-none mb-[6px]">{i + 1} of 3</div>
                <span className="block font-display text-[24px] leading-[1.1] text-g-ink mb-[6px]">{title}</span>
                <span className="block font-body text-[14px] text-g-sub leading-[1.5]">{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="shrink-0 bg-g-bg"
        style={{ padding: "12px 24px calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <Button full arrow onClick={finishOnboarding} disabled={loading}>
          {loading ? "Setting up\u2026" : "Take me in"}
        </Button>
      </div>
    </div>
  );
}
