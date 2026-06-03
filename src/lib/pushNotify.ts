import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.error("[push] VAPID keys missing. public:", !!publicKey, "private:", !!privateKey);
    return false;
  }
  webpush.setVapidDetails("mailto:hello@grounded-app.com", publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; conversationId?: string }
) {
  if (!ensureVapid()) {
    console.log("[push] Skipping: VAPID not configured");
    return;
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_id", userId);

  if (error) {
    console.error("[push] DB error fetching subscriptions:", error.message);
    return;
  }

  if (!subs || subs.length === 0) {
    console.log("[push] No subscriptions found for user:", userId);
    return;
  }

  console.log("[push] Found", subs.length, "subscription(s), sending...");

  const results = await Promise.allSettled(
    subs.map((row) =>
      webpush
        .sendNotification(row.subscription, JSON.stringify(payload))
        .then((res) => {
          console.log("[push] Sent OK, status:", res.statusCode);
          return res;
        })
        .catch(async (err) => {
          console.error("[push] Send failed, status:", err.statusCode, err.body);
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", row.id);
          }
          throw err;
        })
    )
  );

  return results;
}
