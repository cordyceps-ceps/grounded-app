"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatBabyAge } from "@/lib/utils";

interface Baby {
  name: string;
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

interface UserContextValue {
  me: string;
  familyId: string | null;
  baby: Baby | null;
  convos: Convo[];
  loaded: boolean;
  refreshConvos: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  me: "",
  familyId: null,
  baby: null,
  convos: [],
  loaded: false,
  refreshConvos: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState("");
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [baby, setBaby] = useState<Baby | null>(null);
  const [convos, setConvos] = useState<Convo[]>([]);
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
        setFamilyId(profile.family_id);

        const [babiesRes] = await Promise.all([
          supabase
            .from("baby_profiles")
            .select("name, born, dob, due_date, birth_weight")
            .eq("family_id", profile.family_id)
            .limit(1),
          loadConvos(profile.family_id),
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

  return (
    <UserContext.Provider value={{ me, familyId, baby, convos, loaded, refreshConvos }}>
      {children}
    </UserContext.Provider>
  );
}
