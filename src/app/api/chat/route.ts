import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { getTopicById } from "@/lib/topics";
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

function buildSystemPrompt(topicId: string, baby?: { name: string; gender?: string; age: string; born: boolean }, facts?: string[], globalFacts?: string[]) {
  const topic = getTopicById(topicId);
  const topicName = topic?.name?.toLowerCase() || "parenting";
  const books = topic?.sources || [];
  const helplines = topic?.helplines || [];

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
  const allFacts: string[] = [];
  if (globalFacts && globalFacts.length > 0) {
    allFacts.push(...globalFacts.map((f) => `- ${f} (general)`));
  }
  if (facts && facts.length > 0) {
    allFacts.push(...facts.map((f) => `- ${f}`));
  }
  if (allFacts.length > 0) {
    factsContext = `\n\nCurrent facts the parent has noted about ${baby?.name || "their baby"}:\n${allFacts.join("\n")}\nUse these to personalise your answer where relevant.`;
  }

  const bookList = books.map(s => `- "${s.title}" by ${s.author}`).join("\n");
  const citationExamples = books.slice(0, 2).map(s => {
    const lastName = s.author.split(" ").pop();
    return `"According to ${lastName}..."`;
  }).join(" or ");

  let helplineBlock = "";
  if (helplines.length > 0) {
    helplineBlock = `\n\nEscalation resources (surface these when deflecting to a professional):\n${helplines.map(h => `- ${h.name}: ${h.tel}`).join("\n")}`;
  }

  return `You are Grounded's ${topicName} guide — a warm, knowledgeable companion who answers questions from curated, expert-vetted books.

Your tone: warm, encouraging, concise. Lead with the answer. Use numbered steps for physical actions. Normalise common experiences. You are not a medical professional.

IMPORTANT RULES:
- Base your answer on the provided source passages. The passages have been selected from trusted ${topicName} books — use them confidently.
- Cite which book you're drawing from: ${citationExamples}
- You may connect ideas across passages, synthesise advice from multiple sources, and explain concepts in warm, accessible language — but the knowledge itself must come from the passages.
- Do NOT say the books don't cover a topic unless the passages are truly about something completely unrelated. The passages were selected as relevant — trust them and draw useful guidance from them.
- For anything clinical (medications, dosages, diagnoses, concerning symptoms), deflect warmly: "This is one for your GP or health visitor."
- Keep answers scannable: bold key terms, numbered steps for physical actions, bullet points for options.
- When something is common/normal, say so reassuringly.
- End with a brief encouragement and mention professional support is available if needed.
${helplineBlock}
${topic?.promptGuidance ? `\n${topic.promptGuidance}` : ""}
You have access to these source books:
${bookList}${babyContext}${factsContext}`;
}

/**
 * Use Haiku to expand the user's question into individual search keywords.
 * Returns an array of individual terms for OR-based broad search.
 */
async function expandQuery(question: string, topicName: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `You help search a ${topicName} book. Given this parent's question, output 10-15 individual search keywords that would appear in relevant book passages. Include:
- Clinical/medical terms
- Everyday synonyms parents would use
- Related concepts the books likely cover
- Action words

Question: "${question}"

Return ONLY a JSON array of individual keyword strings.`,
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
async function searchKeyword(query: string, topicId: string, limit = 8): Promise<ChunkResult[]> {
  const { data, error } = await supabase.rpc("search_chunks", {
    search_query: query,
    topic: topicId,
    match_limit: limit,
  });

  if (error) return [];
  return (data as ChunkResult[]) || [];
}

/** Compute embedding for a query string */
async function getEmbedding(query: string): Promise<number[] | null> {
  if (!openai) return null;
  try {
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    return res.data[0].embedding;
  } catch {
    return null;
  }
}

/** Semantic vector search using OpenAI embeddings */
async function searchSemantic(query: string, topicId: string, limit = 10, precomputedEmbedding?: number[]): Promise<{ chunks: ChunkResult[]; embedding: number[] | null }> {
  const embedding = precomputedEmbedding || await getEmbedding(query);
  if (!embedding) return { chunks: [], embedding: null };

  try {
    const { data, error } = await supabase.rpc("match_chunks_semantic", {
      query_embedding: JSON.stringify(embedding),
      topic: topicId,
      match_limit: limit,
      similarity_threshold: 0.25,
    });

    if (error) return { chunks: [], embedding };
    return { chunks: (data as ChunkResult[]) || [], embedding };
  } catch {
    return { chunks: [], embedding };
  }
}

interface VideoResult {
  video_id: string;
  title: string;
  description: string;
  channel_name: string;
  channel_handle: string;
  thumbnail_url: string;
  duration: string;
  similarity: number;
}

/** Search for relevant videos using the same embedding */
async function searchVideos(embedding: number[], topicId: string): Promise<VideoResult | null> {
  try {
    const { data, error } = await supabase.rpc("match_videos_semantic", {
      query_embedding: JSON.stringify(embedding),
      topic: topicId,
      match_limit: 1,
      similarity_threshold: 0.28,
    });
    if (error || !data || data.length === 0) return null;
    return data[0] as VideoResult;
  } catch {
    return null;
  }
}

/** Broad OR-based search using individual terms */
async function searchBroad(terms: string[], topicId: string, limit = 15): Promise<ChunkResult[]> {
  if (terms.length === 0) return [];

  // Filter to valid tsquery terms (alphanumeric, hyphens)
  const validTerms = terms
    .map((t) => t.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase())
    .filter((t) => t.length > 2);

  if (validTerms.length === 0) return [];

  const { data, error } = await supabase.rpc("search_chunks_broad", {
    search_terms: validTerms,
    topic: topicId,
    match_limit: limit,
  });

  if (error) return [];
  return (data as ChunkResult[]) || [];
}

/**
 * Use Haiku to re-rank chunks by relevance to the question.
 * Returns the indices of the most relevant chunks, ordered by relevance.
 */
async function rerankChunks(question: string, chunks: ChunkResult[], topicName: string): Promise<ChunkResult[]> {
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

Below are passage previews from ${topicName} books. Return the indices of the 8 MOST relevant passages for answering this question, ordered by relevance.

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
  const { message, baby, facts, globalFacts, history, conversationId, userId, topicId } = body;

  const effectiveTopicId = topicId || "bf";
  const topic = getTopicById(effectiveTopicId);
  const topicName = topic?.name?.toLowerCase() || "parenting";

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 1: Semantic search + keyword expansion in parallel
  const [semanticResult, expandedTerms, keywordResults] = await Promise.all([
    searchSemantic(message, effectiveTopicId, 10),
    expandQuery(message, topicName),
    searchKeyword(message, effectiveTopicId, 8),
  ]);
  const { chunks: semanticResults, embedding: queryEmbedding } = semanticResult;

  // Step 1b: Video search in parallel (uses same embedding)
  const videoPromise = queryEmbedding
    ? searchVideos(queryEmbedding, effectiveTopicId)
    : Promise.resolve(null);

  // Step 2: Broad OR search with expanded terms (only if semantic didn't find enough)
  const [broadResults, videoMatch] = await Promise.all([
    semanticResults.length >= 8 ? Promise.resolve([]) : searchBroad(expandedTerms, effectiveTopicId, 15),
    videoPromise,
  ]);

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
  const chunks = await rerankChunks(message, allChunks, topicName);

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

  // Add video context if we found a match
  let videoContext = "";
  if (videoMatch) {
    videoContext = `\n\n---\n\nPotentially relevant video:\nTitle: ${videoMatch.title}\nChannel: ${videoMatch.channel_name}\nDuration: ${videoMatch.duration}\nVideo ID: ${videoMatch.video_id}\nThumbnail: ${videoMatch.thumbnail_url}\n\nIf this video genuinely helps answer the question, include it using this exact format on its own line:\n:::video{title="${videoMatch.title}" channel="${videoMatch.channel_name}" dur="${videoMatch.duration}" videoId="${videoMatch.video_id}" thumbnailUrl="${videoMatch.thumbnail_url}"}\nOnly include the video if it is directly relevant to what the parent asked. Do NOT include it just because it exists.`;
  }

  // Add current question with RAG context
  messages.push({
    role: "user",
    content: `Here are relevant passages from the source books:\n\n${contextBlock}${videoContext}\n\n---\n\nParent's question: ${message}`,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = "";
        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: buildSystemPrompt(effectiveTopicId, baby, facts, globalFacts),
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
              user_id: userId || null,
            });
            await supabase
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
          } catch {
            // Don't fail the stream if DB save fails
          }

          // Send push notification before closing stream (must await or Vercel kills it)
          if (userId) {
            try {
              const plain = fullText
                .replace(/\*\*(.+?)\*\*/g, "$1")
                .replace(/\*(.+?)\*/g, "$1")
                .replace(/^#{1,6}\s+/gm, "")
                .replace(/^[-*+]\s+/gm, "• ")
                .replace(/^\d+\.\s+/gm, "")
                .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
                .replace(/`([^`]+)`/g, "$1")
                .replace(/\n{2,}/g, "\n")
                .trim();
              const preview = plain.slice(0, 120) + (plain.length > 120 ? "…" : "");
              const baseUrl = new URL(request.url).origin;
              await fetch(`${baseUrl}/api/push/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  title: "Your answer is ready",
                  body: preview,
                  url: `/chat/${conversationId}`,
                  conversationId,
                }),
              });
            } catch (err) {
              console.error("[push] fetch error:", err);
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
