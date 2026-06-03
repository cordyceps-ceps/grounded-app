import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { question } = await request.json();

  if (!question) {
    return Response.json({ followups: [] });
  }

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `A parent asked about breastfeeding: "${question}"

Suggest 2 practical follow-up questions they might find helpful but might not think to ask. Keep them short, warm, and conversational — like something a tired parent would type at 3am.

Return ONLY a JSON array of 2 strings.`,
      }],
    });

    let text = res.content[0].type === "text" ? res.content[0].text : "[]";
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const followups = JSON.parse(text);

    return Response.json({
      followups: Array.isArray(followups) ? followups.slice(0, 2) : [],
    });
  } catch {
    return Response.json({ followups: [] });
  }
}
