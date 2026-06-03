"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatBabyAge } from "@/lib/utils";

interface Baby {
  name: string;
  gender: string | null;
  born: boolean;
  dob: string | null;
  due_date: string | null;
  birth_weight: string | null;
  age: string | null;
}

interface Convo {
  id: string;
  title: string | null;
  topic_id: string;
  updated_at: string;
}

interface TopicFact {
  id: string;
  topic_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface PinnedAnswer {
  id: string;
  conversation_id: string;
  topic_id: string;
  question: string;
  content: string;
  created_at: string;
}

interface CachedSuggestions {
  questions: string[];
  created_at: string;
}

interface UserContextValue {
  me: string;
  userId: string | null;
  familyId: string | null;
  baby: Baby | null;
  convos: Convo[];
  facts: TopicFact[];
  pins: PinnedAnswer[];
  suggestions: Record<string, CachedSuggestions>;
  loaded: boolean;
  refreshConvos: () => Promise<void>;
  refreshFacts: () => Promise<void>;
  refreshPins: () => Promise<void>;
  refreshSuggestions: (topicId: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  me: "",
  userId: null,
  familyId: null,
  baby: null,
  convos: [],
  facts: [],
  pins: [],
  suggestions: {},
  loaded: false,
  refreshConvos: async () => {},
  refreshFacts: async () => {},
  refreshPins: async () => {},
  refreshSuggestions: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [baby, setBaby] = useState<Baby | null>(null);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [facts, setFacts] = useState<TopicFact[]>([]);
  const [pins, setPins] = useState<PinnedAnswer[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, CachedSuggestions>>({});
  const [loaded, setLoaded] = useState(false);

  const loadConvos = async (fId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("conversations")
      .select("id, title, topic_id, updated_at")
      .eq("family_id", fId)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setConvos(data);
  };

  const loadFacts = async (fId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("topic_facts")
      .select("id, topic_id, content, pinned, created_at, updated_at")
      .eq("family_id", fId)
      .order("created_at", { ascending: false });
    if (data) setFacts(data);
  };

  const loadPins = async (fId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("id, conversation_id, content, created_at, conversations!inner(topic_id, family_id, title)")
      .eq("pinned", true)
      .eq("conversations.family_id", fId)
      .order("created_at", { ascending: false });
    if (data) {
      setPins(data.map((d: Record<string, unknown>) => {
        const convo = d.conversations as Record<string, unknown>;
        return {
          id: d.id as string,
          conversation_id: d.conversation_id as string,
          topic_id: convo.topic_id as string,
          question: (convo.title as string) || "Saved answer",
          content: d.content as string,
          created_at: d.created_at as string,
        };
      }));
    }
  };

  const loadSuggestions = async (fId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("suggested_questions")
      .select("topic_id, questions, created_at")
      .eq("family_id", fId);
    if (data) {
      const map: Record<string, CachedSuggestions> = {};
      for (const row of data) {
        map[row.topic_id] = { questions: row.questions, created_at: row.created_at };
      }
      setSuggestions(map);
    }
  };

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, family_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setMe(profile.display_name || user.email?.split("@")[0] || "Parent");
        setUserId(user.id);
        setFamilyId(profile.family_id);

        // Register push notifications (non-blocking)
        import("@/lib/pushSubscription").then(({ registerAndSubscribe }) => {
          registerAndSubscribe().catch(() => {});
        });

        const [babiesRes] = await Promise.all([
          supabase
            .from("baby_profiles")
            .select("name, gender, born, dob, due_date, birth_weight")
            .eq("family_id", profile.family_id)
            .limit(1),
          loadConvos(profile.family_id),
          loadFacts(profile.family_id),
          loadPins(profile.family_id),
          loadSuggestions(profile.family_id),
        ]);

        if (babiesRes.data && babiesRes.data.length > 0) {
          const b = babiesRes.data[0];
          setBaby({
            ...b,
            age: b.born && b.dob ? formatBabyAge(b.dob) : null,
          });
        }
      }
      setLoaded(true);
    };
    load();
  }, []);

  const refreshConvos = async () => {
    if (familyId) await loadConvos(familyId);
  };

  const refreshFacts = async () => {
    if (familyId) await loadFacts(familyId);
  };

  const refreshPins = async () => {
    if (familyId) await loadPins(familyId);
  };

  const refreshSuggestions = async (topicId: string) => {
    if (!familyId) return;
    const recentQuestions = convos
      .filter((c) => c.topic_id === topicId && c.title)
      .slice(0, 5)
      .map((c) => c.title!);
    const topicFacts = facts
      .filter((f) => f.topic_id === topicId)
      .map((f) => f.content);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: familyId,
          topic_id: topicId,
          baby: baby ? { name: baby.name, gender: baby.gender, age: baby.age, born: baby.born } : undefined,
          recent_questions: recentQuestions.length > 0 ? recentQuestions : undefined,
          facts: topicFacts.length > 0 ? topicFacts : undefined,
        }),
      });
      const data = await res.json();
      if (data.questions?.length > 0) {
        setSuggestions((prev) => ({
          ...prev,
          [topicId]: { questions: data.questions, created_at: new Date().toISOString() },
        }));
      }
    } catch {
      // silent fail — suggestions are non-critical
    }
  };

  return (
    <UserContext.Provider value={{ me, userId, familyId, baby, convos, facts, pins, suggestions, loaded, refreshConvos, refreshFacts, refreshPins, refreshSuggestions }}>
      {children}
    </UserContext.Provider>
  );
}
