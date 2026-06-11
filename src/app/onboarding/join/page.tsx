"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link2, Users } from "lucide-react";
import { TopBar, Button, Field } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function JoinPage() {
  return (
    <Suspense>
      <JoinInner />
    </Suspense>
  );
}

function JoinInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) setAuthed(false);
    };
    check();
  }, []);

  const handleJoin = async () => {
    if (!authed) {
      // Send them to create an account, then come back here with code pre-filled
      const returnUrl = `/onboarding/join${code.trim() ? `?code=${encodeURIComponent(code.trim())}` : ""}`;
      router.push(`/onboarding/account?next=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invites/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false);
          setError("Session expired. Tap Join again to sign in first.");
          return;
        }
        setError(data.error || "Something went wrong");
        return;
      }

      // Skip profile — baby already exists from the first parent
      router.push("/onboarding/walkthrough");
    } catch {
      setError("Couldn\u2019t connect. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

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
          {authed
            ? "Paste the invite code your partner shared with you."
            : "Enter your code below, then you\u2019ll create a quick account to join."}
        </div>

        <Field
          label="Invite code"
          icon={Users}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) setError("");
          }}
          placeholder="e.g. ROBIN-4821"
        />

        {error && (
          <div className="mt-3 font-body text-[13px] text-red-500">{error}</div>
        )}

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
        <Button full arrow onClick={handleJoin} disabled={!code.trim() || loading}>
          {loading ? "Joining\u2026" : authed ? "Join family" : "Create account & join"}
        </Button>
      </div>
    </div>
  );
}
