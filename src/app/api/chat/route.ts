import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function buildSystemPrompt(baby?: { name: string; gender?: string; age: string; born: boolean }, facts?: string[]) {
  let babyContext = "";
  if (baby) {
    const pronouns = baby.gender === "girl" ? "she/her" : baby.gender === "boy" ? "he/him" : "they/them";
    if (baby.born) {
      babyContext = `\n\nThe parent is asking about ${baby.name}, who is ${baby.age} old. Use ${pronouns} pronouns for ${baby.name}. Tailor your answer to this age.`;
    } else {
      babyContext = `\n\nThe parent is expecting a baby (${baby.name}). Use ${pronouns} pronouns for ${baby.name}. Tailor your answer for the prenatal stage.`;
    }
  }

  let factsContext = "";
  if (facts && facts.length > 0) {
    factsContext = `\n\nCurrent facts the parent has noted about ${baby?.name || "their baby"}:\n${facts.map((f) => `- ${f}`).join("\n")}\nUse these to personalise your answer where relevant.`;
  }

  return `You are Grounded's breastfeeding guide — a warm, knowledgeable companion who answers questions from curated, expert-vetted books.

Your tone: warm, encouraging, concise. Lead with the answer. Use numbered steps for physical actions. Normalise common experiences. You are not a medical professional.

IMPORTANT RULES:
- Draw primarily from the provided source passages. Cite which book you're drawing from when possible: "According to Huggins..." or "La Leche League recommends..."
- When the source passages directly cover the topic, base your answer on them and cite accordingly.
- When the passages are only partially relevant, use them as a foundation and supplement with well-established breastfeeding guidance that these books are known to cover. Still cite the books where applicable.
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

/** Use Haiku to expand the user's question into search-friendly terms */
async function expandQuery(question: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `You help search a breastfeeding book index. Given this parent's question, output 3 short keyword search phrases that would match relevant book passages. Use clinical/book terminology, not conversational language.

Question: "${question}"

Return ONLY a JSON array of 3 strings. Example: ["latch technique deep attachment", "breast refusal crying fussy", "milk supply low output"]`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "[]";
    return JSON.parse(text);
  } catch {
    return [];
  }
}

interface ChunkResult {
  id: number;
  content: string;
  book_title: string;
  book_author: string;
}

async function searchChunks(query: string, limit = 6): Promise<ChunkResult[]> {
  // Use websearch_to_tsquery directly — it handles natural language
  const { data, error } = await supabase.rpc("search_chunks", {
    search_query: query,
    match_limit: limit,
  });

  if (error) {
    // Fallback to ILIKE with key terms
    const words = query.split(/\s+/).filter((w) => w.length > 3).slice(0, 4);
    if (words.length === 0) return [];
    const { data: fallbackData } = await supabase
      .from("document_chunks")
      .select("id, content, book_title, book_author")
      .or(words.map((w) => `content.ilike.%${w}%`).join(","))
      .limit(limit);
    return (fallbackData as ChunkResult[]) || [];
  }

  return (data as ChunkResult[]) || [];
}

/** Run multiple searches and merge results, deduplicating by chunk ID */
async function multiSearch(question: string, expandedQueries: string[]): Promise<ChunkResult[]> {
  const searches = [
    searchChunks(question, 6),
    ...expandedQueries.map((q) => searchChunks(q, 4)),
  ];

  const results = await Promise.all(searches);
  const seen = new Set<number>();
  const merged: ChunkResult[] = [];

  for (const batch of results) {
    for (const chunk of batch) {
      if (!seen.has(chunk.id)) {
        seen.add(chunk.id);
        merged.push(chunk);
      }
    }
  }

  return merged.slice(0, 12);
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

  // Expand query via Haiku + search in parallel
  const [expandedQueries, directChunks] = await Promise.all([
    expandQuery(message),
    searchChunks(message, 6),
  ]);

  // Run expanded searches and merge with direct results
  let chunks: ChunkResult[];
  if (expandedQueries.length > 0) {
    const expandedResults = await Promise.all(
      expandedQueries.map((q) => searchChunks(q, 4))
    );
    const seen = new Set<number>();
    chunks = [];
    for (const batch of [directChunks, ...expandedResults]) {
      for (const chunk of batch) {
        if (!seen.has(chunk.id)) {
          seen.add(chunk.id);
          chunks.push(chunk);
        }
      }
    }
    chunks = chunks.slice(0, 12);
  } else {
    chunks = directChunks;
  }

  const contextBlock =
    chunks.length > 0
      ? chunks
          .map(
            (c) =>
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
