"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Calendar, Leaf } from "lucide-react";
import { TopBar, Button, Field, Segmented, Dots } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const [status, setStatus] = useState("born");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/onboarding/account");
        return;
      }

      // Create a family (generate ID client-side to avoid RLS read-back issue)
      const familyId = crypto.randomUUID();
      const { error: famError } = await supabase
        .from("families")
        .insert({ id: familyId });

      if (famError) throw famError;

      // Create/update user profile
      const { error: profError } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          family_id: familyId,
          display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Parent",
        });

      if (profError) throw profError;

      // Create baby profile
      const { error: babyError } = await supabase
        .from("baby_profiles")
        .insert({
          family_id: familyId,
          name: name || "Baby",
          gender: gender || null,
          born: status === "born",
          dob: status === "born" && dob ? dob : null,
          due_date: status === "expecting" && dueDate ? dueDate : null,
          birth_weight: status === "born" ? weight : null,
        });

      if (babyError) throw babyError;

      router.push("/onboarding/facts");
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar
        onBack={() => router.push("/onboarding/choose")}
        right={<Dots total={3} current={0} />}
      />

      <div className="flex-1 overflow-y-auto px-6 py-[6px]">
        <div className="font-display text-[34px] leading-[1.05] text-g-ink mb-2">
          Tell us about your baby
        </div>
        <div className="font-body text-[14.5px] text-g-sub mb-[22px] leading-[1.5]">
          Grounded uses these to give you age-appropriate, relevant answers. That&rsquo;s all.
        </div>

        <div className="mb-[18px]">
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: "born", label: "Born" },
              { value: "expecting", label: "Not yet born" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-[14px]">
          <Field
            label="Name (or a nickname)"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Baby"
          />
          <div>
            <div className="font-body text-[13px] font-semibold text-g-sub mb-[7px]">Gender</div>
            <Segmented
              value={gender}
              onChange={setGender}
              options={[
                { value: "girl", label: "Girl" },
                { value: "boy", label: "Boy" },
                { value: "", label: "Skip" },
              ]}
            />
          </div>
          {status === "born" ? (
            <>
              <Field
                label="Date of birth"
                icon={Calendar}
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="e.g. 2026-05-09"
              />
              <Field
                label="Birth weight (kg)"
                icon={Leaf}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 3.4"
                inputMode="decimal"
              />
            </>
          ) : (
            <Field
              label="Due date"
              icon={Calendar}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="e.g. 2026-06-21"
            />
          )}
        </div>

        {/* Contextual tip */}
        <div className="mt-[18px] bg-g-prim-soft rounded-[16px] p-[15px] flex gap-[11px]">
          <span className="text-g-prim shrink-0 mt-[1px]">
            <Leaf size={18} />
          </span>
          <span className="font-body text-[13px] leading-[1.5] text-g-ink">
            {status === "expecting"
              ? "Not born yet? Perfect — pre-natal questions are welcome, and you can add a birth date later."
              : "Just the essentials. Anything specific you\u2019d like Grounded to know lives as a fact you can add later."}
          </span>
        </div>

        {error && (
          <div className="mt-3 font-body text-[13px] text-red-500">{error}</div>
        )}
      </div>

      <div
        className="shrink-0 bg-g-bg"
        style={{ padding: "12px 24px calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <Button full arrow onClick={handleContinue} disabled={loading}>
          {loading ? "Saving\u2026" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
