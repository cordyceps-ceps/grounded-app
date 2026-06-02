"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { TopBar, Button, Field } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signUpWithEmail = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/choose`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding/choose");
  };

  const signInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/choose`,
      },
    });
  };

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar onBack={() => router.push("/onboarding/welcome")} />

      <div className="flex-1 overflow-y-auto px-6 py-[6px]">
        <div className="font-display text-[34px] leading-[1.05] text-g-ink mb-2">
          Create your account
        </div>
        <div className="font-body text-[14.5px] text-g-sub mb-[26px] leading-[1.5]">
          So your conversations and your baby&rsquo;s details are saved safely from the start.
        </div>

        {/* Google button */}
        <Button full variant="panel" onClick={signInWithGoogle} className="font-semibold">
          <span className="inline-flex items-center gap-[11px]">
            <span className="w-6 h-6 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] inline-flex items-center justify-center font-body text-[14px] font-bold text-[#5f6368] shrink-0">
              G
            </span>
            Continue with Google
          </span>
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-g-line" />
          <span className="font-body text-[12.5px] text-g-faint">or</span>
          <span className="flex-1 h-px bg-g-line" />
        </div>

        {/* Email/password */}
        <div className="flex flex-col gap-[14px]">
          <Field
            label="Email"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
          <Field
            label="Password"
            icon={Lock}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
          />
        </div>

        {error && (
          <div className="mt-3 font-body text-[13px] text-red-500">{error}</div>
        )}
      </div>

      <div
        className="shrink-0 bg-g-bg"
        style={{ padding: "12px 24px calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <Button full arrow onClick={signUpWithEmail} disabled={loading || !email || !password}>
          {loading ? "Creating\u2026" : "Create account"}
        </Button>
      </div>
    </div>
  );
}
