import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function buildSystemPrompt(baby?: { name: string; age: string; born: boolean }, facts?: string[]) {
  let babyContext = "";
  if (baby) {
    babyContext = baby.born
      ? `\n\nThe parent is asking about ${baby.name}, who is ${baby.age} old. Tailor your answer to this age.`
      : `\n\nThe parent is expecting a baby (${baby.name}). Tailor your answer for the prenatal stage.`;
  }

  let factsContext = "";
  if (facts && facts.length > 0) {
    factsContext = `\n\nCurrent facts the parent has noted about ${baby?.name || "their baby"}:\n${facts.map((f) => `- ${f}`).join("\n")}\nUse these to personalise your answer where relevant.`;
  }

  return `You are Grounded's breastfeeding guide — a warm, knowledgeable companion who answers questions from curated, expert-vetted books.

Your tone: warm, encouraging, concise. Lead with the answer. Use numbered steps for physical actions. Normalise common experiences. You are not a medical professional.

IMPORTANT RULES:
- ONLY answer from the provided source material. If the sources don't cover a question, say so plainly: "The books I have don't cover that specifically."
- ALWAYS cite which book you're drawing from: "According to Huggins..." or "La Leche League recommends..."
- For anything clinical (medications, dosages, diagnoses, concerning symptoms), deflect warmly: "This is one for your midwife or lactation consultant."
- Keep answers scannable: bold key terms, numbered steps for physical actions, bullet points for options.
- When something is common/normal, say so reassuringly.

Escalation resources (surface these when deflecting to a professional):
- National Breastfeeding Helpline: 0300 100 0212
- La Leche League GB: 0345 120 2918
- Association of Breastfeeding Mothers: 0300 330 5453

You have access to these source books:
- "The Nursing Mother's Companion" by Kathleen Huggins
- "The Womanly Art of Breastfeeding" by La Leche League International
- "Breastfeeding Made Simple" by Nancy Mohrbacher${babyContext}${factsContext}`;
}

async function searchChunks(query: string, limit = 8) {
  const searchTerms = query
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .join(" & ");

  const { data, error } = await supabase.rpc("search_chunks", {
    search_query: searchTerms,
    match_limit: limit,
  });

  if (error) {
    console.error("RPC search failed, using fallback:", error.message);
    const words = query.split(/\s+/).filter((w) => w.length > 3).slice(0, 3);
    const { data: fallbackData } = await supabase
      .from("document_chunks")
      .select("content, book_title, book_author")
      .or(words.map((w) => `content.ilike.%${w}%`).join(","))
      .limit(limit);
    return fallbackData || [];
  }

  return data || [];
}

export async function POST(request: Request) {
  const body = await request.json();
  const { message, baby, facts, history } = body;

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const chunks = await searchChunks(message);

  const contextBlock =
    chunks.length > 0
      ? chunks
          .map(
            (c: { content: string; book_title: string; book_author: string }) =>
              `[Source: ${c.book_title} by ${c.book_author}]\n${c.content}`
          )
          .join("\n\n---\n\n")
      : "No relevant passages found in the source books.";

  // Build conversation messages: previous turns + current question with RAG context
  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history (previous user/assistant pairs)
  if (Array.isArray(history)) {
    for (const msg of history) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  // Add current question with RAG context
  messages.push({
    role: "user",
    content: `Here are relevant passages from the source books:\n\n${contextBlock}\n\n---\n\nParent's question: ${message}`,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: buildSystemPrompt(baby, facts),
          messages,
        });

        response.on("text", (text) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        });

        await response.finalMessage();
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
