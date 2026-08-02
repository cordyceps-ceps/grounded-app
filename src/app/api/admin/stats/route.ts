import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getTopicById } from "@/lib/topics";

const ADMIN_FAMILY_ID = process.env.ADMIN_FAMILY_ID!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // Authenticate the caller
  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await auth.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.family_id !== ADMIN_FAMILY_ID.trim()) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all data in parallel using query builder (no RPC functions needed)
  const [usersRes, allConvosRes, recentConvosRes, recentMsgsRes, allMsgsRes, allConvoMapRes] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("id, display_name, family_id, created_at")
        .neq("family_id", ADMIN_FAMILY_ID),

      supabase
        .from("conversations")
        .select("id, family_id, topic_id, created_at")
        .neq("family_id", ADMIN_FAMILY_ID),

      supabase
        .from("conversations")
        .select("id, family_id, created_at")
        .neq("family_id", ADMIN_FAMILY_ID)
        .gte("created_at", thirtyDaysAgo),

      supabase
        .from("messages")
        .select("id, user_id, created_at, conversation_id")
        .eq("role", "user")
        .gte("created_at", thirtyDaysAgo),

      // All-time user messages — needed for all-time top users
      supabase
        .from("messages")
        .select("id, user_id, created_at, conversation_id")
        .eq("role", "user"),

      // All conversation IDs with their family — needed to filter messages
      supabase
        .from("conversations")
        .select("id, family_id"),
    ]);

  const allUsers = usersRes.data || [];
  const allConvos = allConvosRes.data || [];
  const recentConvos = recentConvosRes.data || [];
  const recentMsgs = recentMsgsRes.data || [];
  const allMsgs = allMsgsRes.data || [];

  // Map conversation → family so we can filter messages
  const convoFamily = new Map<string, string>();
  for (const c of allConvoMapRes.data || []) {
    convoFamily.set(c.id, c.family_id);
  }

  // Filter messages to exclude admin family conversations
  const filteredMsgs = recentMsgs.filter(
    (m) => convoFamily.get(m.conversation_id) !== ADMIN_FAMILY_ID
  );
  const filteredAllMsgs = allMsgs.filter(
    (m) => convoFamily.get(m.conversation_id) !== ADMIN_FAMILY_ID
  );

  // --- Aggregations ---

  const dailyConversations = groupByDay(recentConvos);
  const dailyActiveUsers = groupByDayDistinct(filteredMsgs);
  const recentSignups = allUsers.filter((u) => u.created_at >= thirtyDaysAgo);
  const dailySignups = groupByDay(recentSignups);

  // Top users by conversation count (grouped by family), all-time
  const familyNames = new Map<string, string>();
  for (const u of allUsers) {
    if (!familyNames.has(u.family_id)) {
      familyNames.set(u.family_id, u.display_name || "Unknown");
    }
  }

  const familyCounts = new Map<string, number>();
  for (const c of allConvos) {
    familyCounts.set(c.family_id, (familyCounts.get(c.family_id) || 0) + 1);
  }

  // Count messages (questions) per family, all-time
  const familyMsgCounts = new Map<string, number>();
  for (const m of filteredAllMsgs) {
    const fid = convoFamily.get(m.conversation_id);
    if (fid) {
      familyMsgCounts.set(fid, (familyMsgCounts.get(fid) || 0) + 1);
    }
  }

  const topUsers = Array.from(familyCounts.entries())
    .map(([fid, count]) => ({
      display_name: familyNames.get(fid) || "Unknown",
      convo_count: count,
      question_count: familyMsgCounts.get(fid) || 0,
    }))
    .sort((a, b) => b.convo_count - a.convo_count);

  // Topic popularity by conversation count, all-time
  const topicCounts = new Map<string, number>();
  for (const c of allConvos as { topic_id: string }[]) {
    topicCounts.set(c.topic_id, (topicCounts.get(c.topic_id) || 0) + 1);
  }

  const topicPopularity = Array.from(topicCounts.entries())
    .map(([topicId, count]) => ({
      topic_id: topicId,
      name: getTopicById(topicId)?.name || topicId,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return Response.json({
    totalUsers: allUsers.length,
    totalConversations: allConvos.length,
    totalMessages: filteredMsgs.length,
    dailyConversations,
    dailyActiveUsers,
    dailySignups,
    topUsers,
    topicPopularity,
  });
}

function groupByDay(items: { created_at: string }[]): { day: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const day = item.created_at?.slice(0, 10);
    if (day) map.set(day, (map.get(day) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function groupByDayDistinct(
  items: { created_at: string; user_id: string }[]
): { day: string; count: number }[] {
  const map = new Map<string, Set<string>>();
  for (const item of items) {
    const day = item.created_at?.slice(0, 10);
    if (day && item.user_id) {
      if (!map.has(day)) map.set(day, new Set());
      map.get(day)!.add(item.user_id);
    }
  }
  return Array.from(map.entries())
    .map(([day, set]) => ({ day, count: set.size }))
    .sort((a, b) => a.day.localeCompare(b.day));
}
