import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
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
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const code = (body.code || "").trim().toUpperCase();

  if (!code) {
    return Response.json({ error: "Code is required" }, { status: 400 });
  }

  // Look up the invite
  const { data: invite } = await supabase
    .from("invites")
    .select("id, family_id, expires_at, used_by")
    .eq("code", code)
    .maybeSingle();

  if (!invite) {
    return Response.json({ error: "Invalid invite code" }, { status: 404 });
  }

  if (invite.used_by) {
    return Response.json({ error: "This invite has already been used" }, { status: 410 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return Response.json({ error: "This invite has expired" }, { status: 410 });
  }

  // Check if user already belongs to this family
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("family_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile?.family_id === invite.family_id) {
    return Response.json({ error: "You're already in this family" }, { status: 409 });
  }

  // Link user to the family
  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert({
      id: user.id,
      family_id: invite.family_id,
      display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Parent",
    });

  if (profileError) {
    return Response.json({ error: "Failed to join family" }, { status: 500 });
  }

  // Mark invite as used
  await supabase
    .from("invites")
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq("id", invite.id);

  return Response.json({ family_id: invite.family_id });
}
