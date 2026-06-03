import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/pushNotify";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
- Base your answer on the provided source passages. The passages have been selected from trusted breastfeeding books — use them confidently.
- Cite which book you're drawing from: "According to Huggins..." or "La Leche League recommends..."
- You may connect ideas across passages, synthesise advice from multiple sources, and explain concepts in warm, accessible language — but the knowledge itself must come from the passages.
- Do NOT say the books don't cover a topic unless the passages are truly about something completely unrelated. The passages were selected as relevant — trust them and draw useful guidance from them.
- For anything clinical (medications, dosages, diagnoses, concerning symptoms), deflect warmly: "This is one for your midwife or lactation consultant."
- Keep answers scannable: bold key terms, numbered steps for physical actions, bullet points for options.
- When something is common/normal, say so reassuringly.
- End with a brief encouragement and mention professional support is available if needed.

Escalation resources (surface these when deflecting to a professional):
- National Breastfeeding Helpline: 0300 100 0212
- La Leche League GB: 0345 120 2918
- Association of Breastfeeding Mothers: 0300 330 5453

You have access to these source books:
- "The Nursing Mother's Companion" by Kathleen Huggins
- "The Womanly Art of Breastfeeding" by La Leche League International
- "Breastfeeding Made Simple" by Nancy Mohrbacher${babyContext}${factsContext}`;
}

/**
 * Use Haiku to expand the user's question into individual search keywords.
 * Returns an array of individual terms for OR-based broad search.
 */
async function expandQuery(question: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `You help search a breastfeeding book. Given this parent's question, output 10-15 individual search keywords that would appear in relevant book passages. Include:
- Clinical/medical terms (e.g. "latch", "let-down", "engorgement")
- Everyday synonyms (e.g. "fussy", "crying", "upset")
- Related concepts the books likely cover
- Action words (e.g. "soothe", "calm", "position", "hold")

Question: "${question}"

Return ONLY a JSON array of individual keyword strings. Example: ["latch", "positioning", "refusal", "fussy", "crying", "soothe", "calm", "skin-to-skin", "breast", "nipple"]`,
      }],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "[]";
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
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

/** Original AND-based keyword search */
async function searchKeyword(query: string, limit = 8): Promise<ChunkResult[]> {
  const { data, error } = await supabase.rpc("search_chunks", {
    search_query: query,
    match_limit: limit,
  });

  if (error) return [];
  return (data as ChunkResult[]) || [];
}

/** Semantic vector search using OpenAI embeddings */
async function searchSemantic(query: string, limit = 10): Promise<ChunkResult[]> {
  if (!openai) return [];

  try {
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = embeddingRes.data[0].embedding;

    const { data, error } = await supabase.rpc("match_chunks_semantic", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_limit: limit,
      similarity_threshold: 0.25,
    });

    if (error) return [];
    return (data as ChunkResult[]) || [];
  } catch {
    return [];
  }
}

/** Broad OR-based search using individual terms */
async function searchBroad(terms: string[], limit = 15): Promise<ChunkResult[]> {
  if (terms.length === 0) return [];

  // Filter to valid tsquery terms (alphanumeric, hyphens)
  const validTerms = terms
    .map((t) => t.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase())
    .filter((t) => t.length > 2);

  if (validTerms.length === 0) return [];

  const { data, error } = await supabase.rpc("search_chunks_broad", {
    search_terms: validTerms,
    match_limit: limit,
  });

  if (error) return [];
  return (data as ChunkResult[]) || [];
}

/**
 * Use Haiku to re-rank chunks by relevance to the question.
 * Returns the indices of the most relevant chunks, ordered by relevance.
 */
async function rerankChunks(question: string, chunks: ChunkResult[]): Promise<ChunkResult[]> {
  if (chunks.length <= 8) return chunks;

  try {
    const chunkSummaries = chunks.map((c, i) =>
      `[${i}] ${c.content.slice(0, 300)}`
    ).join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `A parent asked: "${question}"

Below are passage previews from breastfeeding books. Return the indices of the 8 MOST relevant passages for answering this question, ordered by relevance.

${chunkSummaries}

Return ONLY a JSON array of indices. Example: [3, 0, 7, 1, 5, 2, 4, 6]`,
      }],
    });

    let text = response.content[0].type === "text" ? response.content[0].text : "[]";
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const indices: number[] = JSON.parse(text);
    const reranked = indices
      .filter((i) => i >= 0 && i < chunks.length)
      .map((i) => chunks[i]);

    return reranked.length > 0 ? reranked.slice(0, 8) : chunks.slice(0, 8);
  } catch {
    return chunks.slice(0, 8);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { message, baby, facts, history, conversationId, userId } = body;

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 1: Semantic search + keyword expansion in parallel
  const [semanticResults, expandedTerms, keywordResults] = await Promise.all([
    searchSemantic(message, 10),
    expandQuery(message),
    searchKeyword(message, 8),
  ]);

  // Step 2: Broad OR search with expanded terms (only if semantic didn't find enough)
  const broadResults = semanticResults.length >= 8
    ? []
    : await searchBroad(expandedTerms, 15);

  // Step 3: Merge and deduplicate — semantic results first (highest quality)
  const seen = new Set<number>();
  const allChunks: ChunkResult[] = [];
  for (const chunk of [...semanticResults, ...keywordResults, ...broadResults]) {
    if (!seen.has(chunk.id)) {
      seen.add(chunk.id);
      allChunks.push(chunk);
    }
  }

  // Step 4: Re-rank with Haiku if we have too many candidates
  const chunks = await rerankChunks(message, allChunks);

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
        let fullText = "";
        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: buildSystemPrompt(baby, facts),
          messages,
        });

        response.on("text", (text) => {
          fullText += text;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        });

        await response.finalMessage();

        // Save assistant message server-side so it persists even if the client disconnects
        if (conversationId && fullText) {
          try {
            await supabase.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullText,
            });
            await supabase
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
          } catch {
            // Don't fail the stream if DB save fails
          }

          // Send push notification (non-blocking for the stream, but awaited before close)
          if (userId) {
            try {
              const preview = fullText.slice(0, 120) + (fullText.length > 120 ? "…" : "");
              await sendPushToUser(userId, {
                title: "Your answer is ready",
                body: preview,
                url: `/chat/${conversationId}`,
                conversationId,
              });
            } catch {
              // Push failure is non-critical
            }
          }
        }

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
