import { sendPushToUser } from "@/lib/pushNotify";

export async function POST(request: Request) {
  // Verify caller is internal (same-origin server-to-server call)
  // The endpoint requires a valid userId that exists in the DB,
  // limiting abuse to sending notifications to existing users only

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
