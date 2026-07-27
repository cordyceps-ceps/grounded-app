import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getFamilyId(): Promise<{ familyId: string; userId: string } | null> {
  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Record<string, unknown>);
          });
        },
      },
    }
  );

  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) return null;
  return { familyId: profile.family_id, userId: user.id };
}

/** Return the family's active connector token (if any). */
export async function GET() {
  const ctx = await getFamilyId();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("mcp_tokens")
    .select("token, created_at, last_used_at")
    .eq("family_id", ctx.familyId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Response.json({ token: data?.token ?? null, last_used_at: data?.last_used_at ?? null });
}

/** Generate a new connector token (reuses an existing active one if present). */
export async function POST() {
  const ctx = await getFamilyId();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("mcp_tokens")
    .select("token, created_at, last_used_at")
    .eq("family_id", ctx.familyId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return Response.json({ token: existing.token, last_used_at: existing.last_used_at });
  }

  const token = randomBytes(32).toString("base64url");

  const { data, error } = await supabase
    .from("mcp_tokens")
    .insert({ family_id: ctx.familyId, token, created_by: ctx.userId })
    .select("token, last_used_at")
    .single();

  if (error) return Response.json({ error: "Failed to create token" }, { status: 500 });
  return Response.json(data);
}

/** Revoke all active connector tokens for the family. */
export async function DELETE() {
  const ctx = await getFamilyId();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("family_id", ctx.familyId)
    .is("revoked_at", null);

  return Response.json({ ok: true });
}
