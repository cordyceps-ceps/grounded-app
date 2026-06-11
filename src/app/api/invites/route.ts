import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateCode(babyName: string): string {
  const prefix = (babyName || "BABY").toUpperCase().slice(0, 6);
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${digits}`;
}

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

  // Get user's family
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) {
    return Response.json({ error: "No family found" }, { status: 400 });
  }

  // Check for an existing active invite
  const { data: existing } = await supabase
    .from("invites")
    .select("id, code, expires_at")
    .eq("family_id", profile.family_id)
    .is("used_by", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (existing) {
    return Response.json({ code: existing.code, expires_at: existing.expires_at });
  }

  // Get baby name for the code
  const { data: baby } = await supabase
    .from("baby_profiles")
    .select("name")
    .eq("family_id", profile.family_id)
    .limit(1)
    .maybeSingle();

  const code = generateCode(baby?.name || "BABY");

  const { data: invite, error } = await supabase
    .from("invites")
    .insert({
      family_id: profile.family_id,
      code,
      created_by: user.id,
    })
    .select("code, expires_at")
    .single();

  if (error) {
    return Response.json({ error: "Failed to create invite" }, { status: 500 });
  }

  return Response.json(invite);
}
