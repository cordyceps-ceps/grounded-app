"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Plus, X } from "lucide-react";
import { TopBar, Button, Field, Dots, Kicker } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function FactsPage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [babyName, setBabyName] = useState("your baby");
  const [facts, setFacts] = useState<{ id: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/onboarding/account"); return; }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (!profile?.family_id) { router.push("/onboarding/profile"); return; }
      setFamilyId(profile.family_id);

      const { data: baby } = await supabase
        .from("baby_profiles")
        .select("name")
        .eq("family_id", profile.family_id)
        .single();

      if (baby?.name) setBabyName(baby.name);

      const { data: existing } = await supabase
        .from("topic_facts")
        .select("id, content")
        .eq("family_id", profile.family_id)
        .is("topic_id", null);

      if (existing) setFacts(existing);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFact = async () => {
    const text = input.trim();
    if (!text || !familyId) return;
    setSaving(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("topic_facts")
      .insert({ family_id: familyId, topic_id: null, content: text })
      .select("id, content")
      .single();

    if (data) setFacts((prev) => [...prev, data]);
    setInput("");
    setSaving(false);
  };

  const removeFact = async (id: string) => {
    const supabase = createClient();
    await supabase.from("topic_facts").delete().eq("id", id);
    setFacts((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar
        onBack={() => router.push("/onboarding/profile")}
        right={<Dots total={3} current={1} />}
      />

      <div className="flex-1 overflow-y-auto px-6 py-[6px]">
        <div className="font-display text-[34px] leading-[1.05] text-g-ink mb-2">
          Anything else about {babyName}?
        </div>
        <div className="font-body text-[14.5px] text-g-sub mb-[22px] leading-[1.5]">
          These facts are included in every answer Grounded gives, across all topics. They help answers fit your exact situation.
        </div>

        {/* Examples tip */}
        <div className="bg-g-prim-soft rounded-[16px] p-[15px] mb-[22px]">
          <Kicker color="var(--g-prim)" className="mb-[8px]">For example</Kicker>
          <div className="flex flex-col gap-[6px]">
            {[
              "Robin has a tongue tie",
              "Born 3 weeks early by C-section",
              "We're first-time parents",
            ].map((ex, i) => (
              <div key={i} className="font-body text-[13px] text-g-ink leading-[1.45]">
                &ldquo;{ex}&rdquo;
              </div>
            ))}
          </div>
        </div>

        {/* Added facts */}
        {facts.length > 0 && (
          <div className="flex flex-col gap-[8px] mb-[18px]">
            {facts.map((fact) => (
              <div
                key={fact.id}
                className="flex items-start gap-[10px] bg-g-panel rounded-[12px] py-[11px] px-[13px] shadow-[var(--g-shadow-sm)]"
              >
                <span className="flex-1 font-body text-[14px] leading-[1.45] text-g-ink min-w-0">
                  {fact.content}
                </span>
                <button
                  onClick={() => removeFact(fact.id)}
                  className="w-6 h-6 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center text-g-faint shrink-0 mt-[1px]"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add fact input */}
        <div className="flex gap-[9px] items-end">
          <div className="flex-1">
            <Field
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`e.g. ${babyName} was born at home`}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addFact(); }
              }}
            />
          </div>
          <button
            onClick={addFact}
            disabled={!input.trim() || saving}
            className="w-[50px] h-[50px] rounded-[14px] bg-g-prim text-g-on-prim border-none cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40"
            aria-label="Add fact"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div
        className="shrink-0 bg-g-bg"
        style={{ padding: "12px 24px calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        <Button full arrow onClick={() => router.push("/onboarding/walkthrough")}>
          {facts.length > 0 ? "Continue" : "Skip for now"}
        </Button>
      </div>
    </div>
  );
}
