import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails("mailto:hello@grounded-app.com", publicKey, privateKey);
  vapidConfigured = true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; conversationId?: string }
) {
  ensureVapid();
  if (!vapidConfigured) return;

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  const results = await Promise.allSettled(
    subs.map((row) =>
      webpush
        .sendNotification(row.subscription, JSON.stringify(payload))
        .catch(async (err) => {
          // Remove expired/invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", row.id);
          }
          throw err;
        })
    )
  );

  return results;
}
