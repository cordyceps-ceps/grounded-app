"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Copy, Share2, Check, LogOut, Link2, Loader,
  User, Calendar, Leaf, Baby, Plus, Pencil, Trash2,
} from "lucide-react";
import { TopBar, Button, Kicker, Field, Segmented, Sheet } from "@/components/ui";
import { useUser } from "@/components/UserProvider";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  display_name: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { me, userId, baby, familyId, facts: allFacts, refreshFacts } = useUser();

  // Prefetch back navigation
  useEffect(() => { router.prefetch("/home"); }, [router]);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiry, setInviteExpiry] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Baby profile editing
  const [babyName, setBabyName] = useState("");
  const [babyGender, setBabyGender] = useState("");
  const [babyStatus, setBabyStatus] = useState("born");
  const [babyDob, setBabyDob] = useState("");
  const [babyDueDate, setBabyDueDate] = useState("");
  const [babyWeight, setBabyWeight] = useState("");
  const [babySaving, setBabySaving] = useState(false);
  const [babySaved, setBabySaved] = useState(false);
  const [babyDirty, setBabyDirty] = useState(false);

  // Global facts
  const globalFacts = allFacts.filter((f) => !f.topic_id);
  const [factSheetOpen, setFactSheetOpen] = useState(false);
  const [globalFactText, setGlobalFactText] = useState("");
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [factSaving, setFactSaving] = useState(false);

  const openAddFact = () => {
    setEditingFactId(null);
    setGlobalFactText("");
    setFactSheetOpen(true);
  };

  const openEditFact = (fact: { id: string; content: string }) => {
    setEditingFactId(fact.id);
    setGlobalFactText(fact.content);
    setFactSheetOpen(true);
  };

  const handleSaveFact = async () => {
    const text = globalFactText.trim();
    if (!text || !familyId) return;
    setFactSaving(true);
    const supabase = createClient();

    if (editingFactId) {
      await supabase
        .from("topic_facts")
        .update({ content: text, updated_at: new Date().toISOString() })
        .eq("id", editingFactId);
    } else {
      await supabase.from("topic_facts").insert({
        family_id: familyId,
        topic_id: null,
        content: text,
      });
    }

    await refreshFacts();
    setFactSaving(false);
    setFactSheetOpen(false);
    setGlobalFactText("");
    setEditingFactId(null);
  };

  const handleDeleteFact = async (factId: string) => {
    const supabase = createClient();
    await supabase.from("topic_facts").delete().eq("id", factId);
    await refreshFacts();
  };

  // Populate baby fields from context
  useEffect(() => {
    if (baby) {
      setBabyName(baby.name || "");
      setBabyGender(baby.gender || "");
      setBabyStatus(baby.born ? "born" : "expecting");
      setBabyDob(baby.dob || "");
      setBabyDueDate(baby.due_date || "");
      setBabyWeight(baby.birth_weight || "");
    }
  }, [baby]);

  useEffect(() => {
    fetch("/api/family/members")
      .then((r) => r.json())
      .then((data) => {
        if (data.members) setMembers(data.members);
      })
      .catch(() => {});
  }, []);

  const handleBabyChange = () => {
    setBabyDirty(true);
    setBabySaved(false);
  };

  const saveBabyProfile = async () => {
    if (!familyId) return;
    setBabySaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("baby_profiles")
        .update({
          name: babyName || "Baby",
          gender: babyGender || null,
          born: babyStatus === "born",
          dob: babyStatus === "born" && babyDob ? babyDob : null,
          due_date: babyStatus === "expecting" && babyDueDate ? babyDueDate : null,
          birth_weight: babyStatus === "born" ? babyWeight || null : null,
          updated_at: new Date().toISOString(),
        })
        .eq("family_id", familyId);

      if (error) throw error;
      setBabySaved(true);
      setBabyDirty(false);
      setTimeout(() => setBabySaved(false), 2000);
    } catch {
      // silent
    } finally {
      setBabySaving(false);
    }
  };

  const generateInvite = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/invites", { method: "POST" });
      const data = await res.json();
      if (data.code) {
        setInviteCode(data.code);
        setInviteExpiry(data.expires_at);
      }
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      const appUrl = window.location.origin;
      await navigator.share({
        title: "Join me on Grounded",
        text: `Join our family on Grounded!\n\n1. Open ${appUrl}\n2. Tap "Sign up" to create your account\n3. Choose "Joining my partner"\n4. Enter this code: ${inviteCode}\n\nYou\u2019ll see everything I\u2019ve saved \u2014 conversations, facts, and ${baby?.name || "baby"}\u2019s profile.`,
      });
    } catch {
      handleCopy();
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/onboarding/welcome");
  };

  const daysLeft = inviteExpiry
    ? Math.max(0, Math.ceil((new Date(inviteExpiry).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="min-h-[100dvh] bg-g-bg flex flex-col">
      <TopBar onBack={() => startTransition(() => router.push("/home"))} title="Settings" />

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "6px 20px calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
      >
        {/* Account */}
        <Kicker className="mb-3 mt-2">Account</Kicker>
        <div className="bg-g-panel rounded-[18px] p-[17px] shadow-[var(--g-shadow-sm)] mb-6">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-g-prim text-g-on-prim flex items-center justify-center font-body text-[16px] font-bold shrink-0">
              {(me || "P")[0]}
            </span>
            <div>
              <div className="font-body text-[16px] font-semibold text-g-ink">{me}</div>
              <div className="font-body text-[12.5px] text-g-faint">Logged in</div>
            </div>
          </div>
        </div>

        {/* Baby profile */}
        <Kicker className="mb-3">Baby</Kicker>
        <div className="bg-g-panel rounded-[18px] p-[17px] shadow-[var(--g-shadow-sm)] mb-6">
          <div className="flex items-center gap-[10px] mb-[14px]">
            <Baby size={18} className="text-g-prim shrink-0" />
            <span className="font-body text-[14.5px] font-semibold text-g-ink">
              {baby?.name || "Baby"}&rsquo;s profile
            </span>
          </div>

          <div className="flex flex-col gap-[14px]">
            <div className="mb-[2px]">
              <Segmented
                value={babyStatus}
                onChange={(v) => { setBabyStatus(v); handleBabyChange(); }}
                options={[
                  { value: "born", label: "Born" },
                  { value: "expecting", label: "Not yet born" },
                ]}
              />
            </div>

            <Field
              label="Name (or a nickname)"
              icon={User}
              value={babyName}
              onChange={(e) => { setBabyName(e.target.value); handleBabyChange(); }}
              placeholder="Baby"
            />

            <div>
              <div className="font-body text-[13px] font-semibold text-g-sub mb-[7px]">Sex</div>
              <Segmented
                value={babyGender}
                onChange={(v) => { setBabyGender(v); handleBabyChange(); }}
                options={[
                  { value: "girl", label: "Girl" },
                  { value: "boy", label: "Boy" },
                  { value: "", label: "Skip" },
                ]}
              />
            </div>

            {babyStatus === "born" ? (
              <>
                <Field
                  label="Date of birth"
                  icon={Calendar}
                  type="date"
                  value={babyDob}
                  onChange={(e) => { setBabyDob(e.target.value); handleBabyChange(); }}
                  placeholder="e.g. 2026-05-09"
                />
                <Field
                  label="Birth weight (kg)"
                  icon={Leaf}
                  value={babyWeight}
                  onChange={(e) => { setBabyWeight(e.target.value); handleBabyChange(); }}
                  placeholder="e.g. 3.4"
                  inputMode="decimal"
                />
              </>
            ) : (
              <Field
                label="Due date"
                icon={Calendar}
                type="date"
                value={babyDueDate}
                onChange={(e) => { setBabyDueDate(e.target.value); handleBabyChange(); }}
                placeholder="e.g. 2026-06-21"
              />
            )}
          </div>

          {babyDirty && (
            <div className="mt-[16px]">
              <Button full onClick={saveBabyProfile} disabled={babySaving}>
                {babySaving ? (
                  <span className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin" /> Saving...
                  </span>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          )}
          {babySaved && (
            <div className="mt-[10px] flex items-center justify-center gap-[6px] font-body text-[13px] text-g-prim font-semibold">
              <Check size={15} /> Saved
            </div>
          )}
        </div>

        {/* Global facts */}
        <Kicker className="mb-3">About {baby?.name || "your baby"}</Kicker>
        <div className="bg-g-panel rounded-[18px] p-[17px] shadow-[var(--g-shadow-sm)] mb-6">
          <div className="font-body text-[13.5px] text-g-sub leading-[1.5] mb-[14px]">
            Facts here are included in every conversation across all topics.
          </div>

          {globalFacts.length > 0 && (
            <div className="flex flex-col gap-[7px] mb-[14px]">
              {globalFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="flex items-start gap-[10px] bg-g-panel2 rounded-[11px] py-[10px] px-[13px]"
                >
                  <span className="flex-1 font-body text-[13.5px] leading-[1.45] text-g-ink min-w-0">
                    {fact.content}
                  </span>
                  <div className="flex gap-[4px] shrink-0">
                    <button
                      onClick={() => openEditFact(fact)}
                      className="w-7 h-7 rounded-full bg-g-bg flex items-center justify-center border-none cursor-pointer text-g-sub"
                      aria-label="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteFact(fact.id)}
                      className="w-7 h-7 rounded-full bg-g-bg flex items-center justify-center border-none cursor-pointer text-g-sub"
                      aria-label="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button size="sm" variant="soft" icon={Plus} onClick={openAddFact}>
            Add a fact
          </Button>
        </div>

        {/* Family */}
        <Kicker className="mb-3">Family</Kicker>
        <div className="bg-g-panel rounded-[18px] p-[17px] shadow-[var(--g-shadow-sm)] mb-4">
          <div className="flex items-center gap-[10px] mb-[14px]">
            <Users size={18} className="text-g-prim shrink-0" />
            <span className="font-body text-[14.5px] font-semibold text-g-ink">Members</span>
          </div>
          {members.length > 0 ? (
            <div className="flex flex-col gap-[10px]">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-body text-[13px] font-bold shrink-0 ${
                      m.id === userId ? "bg-g-prim text-g-on-prim" : "bg-g-panel2 text-g-sub"
                    }`}
                  >
                    {(m.display_name || "P")[0]}
                  </span>
                  <span className="font-body text-[14.5px] text-g-ink">
                    {m.display_name}
                    {m.id === userId && (
                      <span className="text-g-faint text-[12.5px] ml-1">(you)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-body text-[13.5px] text-g-sub">Loading...</div>
          )}
        </div>

        {/* Invite */}
        {members.length < 2 && (
          <div className="bg-g-prim-soft rounded-[18px] p-[17px] mb-6">
            <div className="flex items-center gap-[10px] mb-[10px]">
              <Link2 size={18} className="text-g-prim shrink-0" />
              <span className="font-body text-[14.5px] font-semibold text-g-ink">Invite your partner</span>
            </div>
            <div className="font-body text-[13px] text-g-sub leading-[1.5] mb-[14px]">
              Share an invite code so they can join your family space.
              You&rsquo;ll share conversations, facts, and your baby&rsquo;s profile.
            </div>

            {inviteCode ? (
              <div>
                <div className="bg-g-bg rounded-[14px] p-[14px] flex items-center justify-between mb-[10px]">
                  <span className="font-body text-[22px] font-bold text-g-ink tracking-[1px]">
                    {inviteCode}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="w-9 h-9 rounded-full bg-g-panel flex items-center justify-center border-none cursor-pointer text-g-sub shadow-[var(--g-shadow-sm)]"
                      aria-label="Copy code"
                    >
                      {copied ? <Check size={16} className="text-g-prim" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-9 h-9 rounded-full bg-g-prim text-g-on-prim flex items-center justify-center border-none cursor-pointer shadow-[var(--g-shadow-sm)]"
                      aria-label="Share code"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                {daysLeft !== null && (
                  <div className="font-body text-[12px] text-g-faint">
                    Expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
                  </div>
                )}
              </div>
            ) : (
              <Button full onClick={generateInvite} disabled={generating}>
                {generating ? (
                  <span className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin" /> Generating...
                  </span>
                ) : (
                  "Generate invite code"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 font-body text-[14px] font-semibold text-red-500 bg-transparent border-[1.5px] border-red-200 rounded-[14px] py-[13px] cursor-pointer mb-4"
        >
          <LogOut size={16} />
          {loggingOut ? "Logging out\u2026" : "Log out"}
        </button>
      </div>

      {/* Add / Edit global fact sheet */}
      <Sheet
        open={factSheetOpen}
        onClose={() => { setFactSheetOpen(false); setGlobalFactText(""); setEditingFactId(null); }}
        title={editingFactId ? "Edit fact" : "Add a fact"}
      >
        <Field
          label={`What\u2019s true about ${baby?.name || "your baby"} across all topics?`}
          value={globalFactText}
          onChange={(e) => setGlobalFactText(e.target.value)}
          placeholder="e.g. Has a tongue tie, Born at 36 weeks"
        />
        <div className="mt-4">
          <Button full onClick={handleSaveFact} disabled={!globalFactText.trim() || factSaving}>
            {factSaving ? "Saving\u2026" : "Save"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
