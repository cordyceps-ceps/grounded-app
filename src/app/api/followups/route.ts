import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { question, answer } = await request.json();

  if (!question) {
    return Response.json({ followups: [] });
  }

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `A parent asked this breastfeeding question: "${question}"

They received this answer:
"""
${(answer || "").slice(0, 1500)}
"""

Write 2 follow-up questions the parent would naturally want to ask next. Rules:
- Written from the PARENT'S perspective, exactly how a tired mum would type it at 3am (e.g. "How do I know if she's actually full after a feed?")
- About something RELATED but NOT already covered in the answer above
- Short, specific, and practical — not vague or diagnostic
- Never ask for information the app already knows (baby's name, age, etc.)

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
