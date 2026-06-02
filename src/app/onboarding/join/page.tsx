"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Users } from "lucide-react";
import { TopBar, Button, Field } from "@/components/ui";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar onBack={() => router.push("/onboarding/choose")} />

      <div className="flex-1 overflow-y-auto px-6 py-[6px]">
        <div className="w-14 h-14 rounded-full bg-g-prim-soft text-g-prim flex items-center justify-center mb-[18px]">
          <Link2 size={28} />
        </div>

        <div className="font-display text-[34px] leading-[1.05] text-g-ink mb-2">
          Join your partner&rsquo;s space
        </div>
        <div className="font-body text-[14.5px] text-g-sub mb-6 leading-[1.5]">
          Ask your partner to send you an invite from their{" "}
          <em>Settings &rarr; Family</em> — by email or a shareable link.
          Open it on this phone, or paste the code below.
        </div>

        <Field
          label="Invite code"
          icon={Users}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. THEO-4821"
        />

        <div className="mt-4 bg-g-panel rounded-[16px] p-[15px] shadow-[var(--g-shadow-sm)]">
          <div className="font-body text-[13.5px] font-bold text-g-ink mb-1">
            What happens when you join
          </div>
          <div className="font-body text-[13px] leading-[1.5] text-g-sub">
            You&rsquo;ll share every conversation, your baby&rsquo;s profile,
            and saved facts — under one family. You keep your own login.
          </div>
        </div>
      </div>

      <div
        className="shrink-0 bg-g-bg"
        style={{ padding: "12px 24px calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <Button full arrow onClick={() => router.push("/home")} disabled={!code.trim()}>
          Join family
        </Button>
      </div>
    </div>
  );
}
