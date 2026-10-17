import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { getTopicById, isAllTopic, searchableTopics } from "@/lib/topics";
import { buildSystemPrompt } from "@/lib/systemPrompt";
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
  topic_name?: string;
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
async function rerankChunks(question: string, chunks: ChunkResult[], topicName: string, keep = 8): Promise<ChunkResult[]> {
  if (chunks.length <= keep) return chunks;

  try {
    const chunkSummaries = chunks.map((c, i) =>
      `[${i}]${c.topic_name ? ` (${c.topic_name})` : ""} ${c.content.slice(0, 300)}`
    ).join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `A parent asked: "${question}"

Below are passage previews from ${topicName} books. Return the indices of the ${keep} MOST relevant passages for answering this question, ordered by relevance.

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

    return reranked.length > 0 ? reranked.slice(0, keep) : chunks.slice(0, keep);
  } catch {
    return chunks.slice(0, keep);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { message, baby, facts, globalFacts, history, conversationId, userId, topicId } = body;

  const effectiveTopicId = topicId || "bf";
  const all = isAllTopic(effectiveTopicId);
  const topic = all ? undefined : getTopicById(effectiveTopicId);
  const topicName = all ? "parenting" : topic?.name?.toLowerCase() || "parenting";

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // "All" searches every searchable topic; a single topic searches just itself.
  const searchTopics = all
    ? searchableTopics().map((t) => ({ id: t.id, name: t.name }))
    : [{ id: effectiveTopicId, name: topic?.name || "" }];

  // Step 1: one embedding + keyword expansion, shared by every topic searched
  const [queryEmbedding, expandedTerms] = await Promise.all([
    getEmbedding(message),
    expandQuery(message, topicName),
  ]);

  // Step 2: per topic, semantic + keyword (+ broad fallback) + video search in parallel
  const perTopic = await Promise.all(
    searchTopics.map(async (t) => {
      const [semantic, keyword, video] = await Promise.all([
        searchSemantic(message, t.id, 10, queryEmbedding ?? undefined),
        searchKeyword(message, t.id, 8),
        queryEmbedding ? searchVideos(queryEmbedding, t.id) : Promise.resolve(null),
      ]);
      const broad = semantic.chunks.length >= 8 ? [] : await searchBroad(expandedTerms, t.id, 15);
      const tag = (c: ChunkResult) => (all ? { ...c, topic_name: t.name } : c);
      return { chunks: [...semantic.chunks, ...keyword, ...broad].map(tag), video };
    })
  );

  // Step 3: merge and deduplicate. Within a topic, semantic results come first (highest quality).
  // Across topics, interleave so no single topic crowds out the others before re-ranking.
  const seen = new Set<number>();
  const allChunks: ChunkResult[] = [];
  const longest = Math.max(...perTopic.map((p) => p.chunks.length), 0);
  for (let i = 0; i < longest; i++) {
    for (const p of perTopic) {
      const chunk = p.chunks[i];
      if (chunk && !seen.has(chunk.id)) {
        seen.add(chunk.id);
        allChunks.push(chunk);
      }
    }
  }

  // Best video across topics (single-topic: just that topic's match)
  const videoMatch =
    perTopic
      .map((p) => p.video)
      .filter((v): v is VideoResult => !!v)
      .sort((a, b) => b.similarity - a.similarity)[0] || null;

  // Step 4: Re-rank with Haiku if we have too many candidates
  const chunks = await rerankChunks(message, allChunks, topicName, all ? 10 : 8);

  const contextBlock =
    chunks.length > 0
      ? chunks
          .map(
            (c) =>
              `[Source: ${c.book_title} by ${c.book_author}${c.topic_name ? ` (topic: ${c.topic_name})` : ""}]\n${c.content}`
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
