"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { UserContext, type UserContextValue } from "@/components/UserProvider";

function iso(daysAgo: number, hoursAgo = 0) {
  return new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();
}

function Inner({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const night = params.get("theme") === "night";
  const empty = params.get("empty") === "1";

  useEffect(() => {
    document.documentElement.classList.toggle("night", night);
  }, [night]);

  const value = useMemo<UserContextValue>(
    () => ({
      me: "Tess",
      userId: "fixture-user",
      familyId: "fixture-family",
      baby: {
        name: "Robin",
        gender: null,
        born: true,
        dob: iso(77),
        due_date: null,
        birth_weight: "3.4 kg",
        age: "11 weeks",
      },
      convos: empty
        ? []
        : [
            { id: "c1", title: "Is cluster feeding normal in the evenings?", topic_id: "bf", updated_at: iso(0, 2) },
            { id: "c2", title: "Why won't she nap longer than 30 minutes?", topic_id: "sleep", updated_at: iso(1) },
            { id: "c3", title: "When do babies start rolling over?", topic_id: "develop", updated_at: iso(4) },
          ],
      facts: empty
        ? []
        : [
            { id: "f1", topic_id: "bf", content: "Combination feeding since week 3", pinned: true, created_at: iso(30), updated_at: iso(2) },
            { id: "f2", topic_id: "sleep", content: "Naps in the pram, bedtime around 7:30", pinned: false, created_at: iso(20), updated_at: iso(20) },
            { id: "f3", topic_id: null, content: "Born at 38 weeks", pinned: false, created_at: iso(70), updated_at: iso(3) },
          ],
      pins: [],
      suggestions: {},
      members: [
        { id: "fixture-user", display_name: "Tess" },
        { id: "fixture-partner", display_name: "Nick" },
      ],
      loaded: true,
      memberName: (id) => (id === "fixture-user" ? "Tess" : "Nick"),
      refreshConvos: async () => {},
      refreshFacts: async () => {},
      refreshPins: async () => {},
      refreshSuggestions: async () => {},
    }),
    [empty]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function FixtureProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Inner>{children}</Inner>
    </Suspense>
  );
}
