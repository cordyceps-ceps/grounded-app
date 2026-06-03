import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { family_id, topic_id, baby, recent_questions, facts } =
    await request.json();

  if (!family_id || !topic_id) {
    return Response.json({ error: "family_id and topic_id required" }, { status: 400 });
  }

  const pronouns =
    baby?.gender === "girl" ? "she/her" : baby?.gender === "boy" ? "he/him" : "they/them";

  const babyLine = baby
    ? `The baby is called ${baby.name}${baby.age ? `, ${baby.age} old` : ""}${baby.gender ? ` (${pronouns})` : ""}.`
    : "";

  const recentLine =
    recent_questions && recent_questions.length > 0
      ? `\nQuestions already asked recently:\n${recent_questions.map((q: string) => `- ${q}`).join("\n")}\nDo NOT repeat these.`
      : "";

  const factsLine =
    facts && facts.length > 0
      ? `\nFacts about the baby:\n${facts.map((f: string) => `- ${f}`).join("\n")}`
      : "";

  const prompt = `You suggest questions a new parent might want to ask about breastfeeding.
${babyLine}${factsLine}${recentLine}

Return exactly 3 short, warm, conversational questions. Each should feel natural — like something a parent would actually type at 3am. Tailor to the baby's age and situation.

Return ONLY a JSON array of 3 strings, no other text. Example: ["question 1?", "question 2?", "question 3?"]`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "[]";
    const questions = JSON.parse(text);

    // Upsert into DB
    await supabase.from("suggested_questions").upsert(
      {
        family_id,
        topic_id,
        questions,
        created_at: new Date().toISOString(),
      },
      { onConflict: "family_id,topic_id" }
    );

    return Response.json({ questions });
  } catch {
    return Response.json({ questions: [] }, { status: 200 });
  }
}
