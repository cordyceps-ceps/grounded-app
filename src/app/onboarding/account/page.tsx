"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import { TopBar, Button, Field } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  return (
    <Suspense>
      <AccountInner />
    </Suspense>
  );
}

function AccountInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";
  const nextUrl = searchParams.get("next");
  const defaultNext = "/onboarding/choose";
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailAuth = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();

    if (mode === "signup") {
      const redirectAfter = nextUrl || defaultNext;
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectAfter)}`,
          data: { full_name: firstName.trim() },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push(redirectAfter);
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Check if onboarding is complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_complete")
          .eq("id", user.id)
          .single();

        if (profile?.onboarding_complete) {
          router.push("/home");
          return;
        }
      }

      router.push(nextUrl || defaultNext);
    }
  };

  const signInWithGoogle = async () => {
    const supabase = createClient();
    const redirectAfter = nextUrl || defaultNext;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectAfter)}`,
      },
    });
  };

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar onBack={() => router.push("/onboarding/welcome")} />

      <div className="flex-1 overflow-y-auto px-6 py-[6px]">
        <div className="font-display text-[34px] leading-[1.05] text-g-ink mb-2">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </div>
        <div className="font-body text-[14.5px] text-g-sub mb-[26px] leading-[1.5]">
          {mode === "signup"
            ? "So your conversations and your baby\u2019s details are saved safely from the start."
            : "Sign in to pick up where you left off."}
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

        {/* Fields */}
        <div className="flex flex-col gap-[14px]">
          {mode === "signup" && (
            <Field
              label="First name"
              icon={User}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="What should we call you?"
              autoComplete="given-name"
            />
          )}
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
            placeholder={mode === "signup" ? "Create a password" : "Your password"}
          />
        </div>

        {error && (
          <div className="mt-3 font-body text-[13px] text-red-500">{error}</div>
        )}

        <button
          type="button"
          onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}
          className="mt-4 font-body text-[13.5px] text-g-prim"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "Don\u2019t have an account? Sign up"}
        </button>
      </div>

      <div
        className="shrink-0 bg-g-bg"
        style={{ padding: "12px 24px calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <Button full arrow onClick={handleEmailAuth} disabled={loading || !email || !password || (mode === "signup" && !firstName.trim())}>
          {loading
            ? (mode === "signup" ? "Creating\u2026" : "Signing in\u2026")
            : (mode === "signup" ? "Create account" : "Sign in")}
        </Button>
      </div>
    </div>
  );
}
