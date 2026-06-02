"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Book, User, MessageSquare, Leaf } from "lucide-react";
import { TopBar, Button, Kicker, Dots } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  {
    icon: Book,
    title: "The sources are always visible",
    sub: "Every topic lists the exact books behind its answers. Tap any to see them — or buy a copy.",
  },
  {
    icon: User,
    title: "Your context comes along",
    sub: "Grounded quietly knows your baby\u2019s age and the facts you save, so answers fit your situation.",
  },
  {
    icon: MessageSquare,
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
        onBack={() => router.push("/onboarding/profile")}
        right={<Dots total={3} current={2} />}
      />

      <div className="flex-1 overflow-y-auto px-6 py-[6px]">
        <Kicker className="mb-[10px]">Before you dive in</Kicker>
        <div className="font-display text-[34px] leading-[1.05] text-g-ink mb-6">
          Three things worth knowing
        </div>

        <div className="flex flex-col gap-[13px]">
          {STEPS.map(({ icon: Icon, title, sub }, i) => (
            <div
              key={i}
              className="bg-g-panel rounded-[18px] p-[17px] shadow-[var(--g-shadow-sm)] flex gap-[13px] items-start"
            >
              <span className="w-10 h-10 rounded-[13px] bg-g-prim-soft text-g-prim flex items-center justify-center shrink-0">
                <Icon size={20} />
              </span>
              <span>
                <span className="block font-body text-[15.5px] font-bold text-g-ink mb-[3px]">{title}</span>
                <span className="block font-body text-[13.5px] text-g-sub leading-[1.45]">{sub}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="shrink-0 bg-g-bg"
        style={{ padding: "12px 24px calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <Button full icon={Leaf} onClick={finishOnboarding} disabled={loading}>
          {loading ? "Setting up\u2026" : "Take me in"}
        </Button>
      </div>
    </div>
  );
}
