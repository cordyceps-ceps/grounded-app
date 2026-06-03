import { sendPushToUser } from "@/lib/pushNotify";

export async function POST(request: Request) {
  // Internal-only endpoint — verify shared secret
  const secret = request.headers.get("x-push-secret");
  if (secret !== process.env.VAPID_PRIVATE_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { userId, title, body, url, conversationId } = await request.json();

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  try {
    const results = await sendPushToUser(userId, {
      title: title || "Your answer is ready",
      body: body || "",
      url,
      conversationId,
    });
    console.log("[push/send] Results:", JSON.stringify(results?.map(r => r.status)));
    return Response.json({ ok: true, results: results?.map(r => r.status) });
  } catch (err) {
    console.error("[push/send] Error:", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
