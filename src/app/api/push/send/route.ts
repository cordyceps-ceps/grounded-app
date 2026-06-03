import { sendPushToUser } from "@/lib/pushNotify";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, body: msgBody, url, conversationId } = body;

    if (!userId) {
      return Response.json({ ok: false, error: "Missing userId" }, { status: 400 });
    }

    console.log("[push/send] Received request for user:", userId);

    const results = await sendPushToUser(userId, {
      title: title || "Your answer is ready",
      body: msgBody || "",
      url,
      conversationId,
    });

    const statuses = results?.map(r => r.status) || [];
    console.log("[push/send] Results:", JSON.stringify(statuses));
    return Response.json({ ok: true, results: statuses });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[push/send] Error:", message, stack);
    return Response.json({ ok: false, error: message, stack }, { status: 500 });
  }
}
