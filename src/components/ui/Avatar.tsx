"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserProvider";

export function Avatar() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { me } = useUser();
  const initial = (me || "P")[0];

  useEffect(() => { router.prefetch("/settings"); }, [router]);

  return (
    <button
      onClick={() => startTransition(() => router.push("/settings"))}
      className="flex items-center justify-center rounded-full font-body text-[13px] font-bold shrink-0 shadow-[var(--g-shadow-sm)] bg-g-prim text-g-on-prim border-none cursor-pointer p-0"
      style={{ width: 34, height: 34 }}
      aria-label="Settings"
    >
      {initial}
    </button>
  );
}
