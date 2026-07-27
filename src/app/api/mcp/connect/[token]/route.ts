import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { TOPICS, getTopicById } from "@/lib/topics";
import { formatBabyAge } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROTOCOL_VERSION = "2025-06-18";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
};

const readyTopics = () => TOPICS.filter((t) => t.ready && !t.hidden);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function rpcResult(id: unknown, result: unknown) {
  return json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: unknown, code: number, message: string) {
  return json({ jsonrpc: "2.0", id, error: { code, message } });
}

interface FamilyContext {
  familyId: string;
  baby: { name: string; gender?: string; age: string | null; born: boolean } | null;
  globalFacts: string[];
  factsByTopic: Record<string, string[]>;
}

/** Validate the URL token, resolve the family, and load baby + facts. */
async function resolveFamily(token: string): Promise<FamilyContext | null> {
  const { data: row } = await supabase
    .from("mcp_tokens")
    .select("family_id")
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();

  if (!row?.family_id) return null;

  // Best-effort touch of last_used_at
  supabase
    .from("mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token)
    .then(() => {});

  const familyId = row.family_id as string;

  const [{ data: babies }, { data: factRows }] = await Promise.all([
    supabase
      .from("baby_profiles")
      .select("name, gender, born, dob, due_date")
      .eq("family_id", familyId)
      .limit(1),
    supabase
      .from("topic_facts")
      .select("topic_id, content")
      .eq("family_id", familyId),
  ]);

  let baby: FamilyContext["baby"] = null;
  if (babies && babies.length > 0) {
    const b = babies[0];
    baby = {
      name: b.name,
      gender: b.gender ?? undefined,
      born: b.born,
      age: b.born && b.dob ? formatBabyAge(b.dob) : null,
    };
  }

  const globalFacts: string[] = [];
  const factsByTopic: Record<string, string[]> = {};
  for (const f of factRows ?? []) {
    if (!f.topic_id) globalFacts.push(f.content);
    else (factsByTopic[f.topic_id] ??= []).push(f.content);
  }

  return { familyId, baby, globalFacts, factsByTopic };
}

/** Ask Haiku to classify the question into a ready topic. */
async function guessTopic(question: string): Promise<{ topicId: string | null; confident: boolean }> {
  const options = readyTopics()
    .map((t) => `- ${t.id}: ${t.name} — ${t.blurb}`)
    .join("\n");
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      messages: [{
        role: "user",
        content: `Classify this parenting question into one of these topics:\n${options}\n\nQuestion: "${question}"\n\nReturn ONLY a JSON object: {"topic": "<id or null>", "confidence": "high"|"medium"|"low"}. Use null and "low" if it clearly fits none or is genuinely ambiguous between topics.`,
      }],
    });
    let text = res.content[0].type === "text" ? res.content[0].text : "{}";
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(text) as { topic?: string | null; confidence?: string };
    const valid = parsed.topic && getTopicById(parsed.topic)?.ready ? parsed.topic : null;
    return { topicId: valid, confident: valid !== null && parsed.confidence === "high" };
  } catch {
    return { topicId: null, confident: false };
  }
}

/** Run the exact same RAG pipeline as the app by calling /api/chat, accumulating the stream. */
async function runGroundedAnswer(
  origin: string,
  message: string,
  topicId: string,
  ctx: FamilyContext
): Promise<string> {
  const res = await fetch(`${origin}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      topicId,
      baby: ctx.baby
        ? { name: ctx.baby.name, gender: ctx.baby.gender, age: ctx.baby.age, born: ctx.baby.born }
        : undefined,
      facts: ctx.factsByTopic[topicId] ?? [],
      globalFacts: ctx.globalFacts,
    }),
  });

  if (!res.body) throw new Error("No response from Grounded");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let answer = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.text) answer += parsed.text;
        if (parsed.error) throw new Error(parsed.error);
      } catch {
        // skip malformed chunk
      }
    }
  }

  return answer.trim();
}

// ---- MCP tool definitions ----

const TOOLS = [
  {
    name: "ask_grounded",
    description:
      "Ask a parenting question and get an answer grounded ONLY in Grounded's curated, expert-vetted books. Robin's profile (age) and the family's saved facts are automatically included so answers are personalised. If you don't pass a topic, Grounded guesses it; if it's unsure it will ask you to pick one. Answers are cited to the source books. Use this instead of general knowledge for parenting questions.",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The parenting question to answer.",
        },
        topic: {
          type: "string",
          description: `Optional topic id. One of: ${readyTopics().map((t) => t.id).join(", ")}. Omit to let Grounded choose.`,
          enum: readyTopics().map((t) => t.id),
        },
      },
      required: ["question"],
    },
  },
  {
    name: "list_topics",
    description: "List the parenting topics Grounded can answer questions about, with their source books.",
    inputSchema: { type: "object", properties: {} },
  },
];

function toolText(text: string) {
  return { content: [{ type: "text", text }] };
}

async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  origin: string,
  ctx: FamilyContext
) {
  if (name === "list_topics") {
    const lines = readyTopics().map((t) => {
      const books = t.sources.map((s) => `“${s.title}” by ${s.author}`).join("; ");
      return `**${t.name}** (id: \`${t.id}\`) — ${t.blurb}\nSources: ${books}`;
    });
    return toolText(lines.join("\n\n"));
  }

  if (name === "ask_grounded") {
    const question = typeof args.question === "string" ? args.question.trim() : "";
    if (!question) return toolText("Please provide a question.");

    let topicId = typeof args.topic === "string" ? args.topic : "";

    if (topicId && !getTopicById(topicId)?.ready) {
      const valid = readyTopics().map((t) => `\`${t.id}\` (${t.name})`).join(", ");
      return toolText(`"${topicId}" isn't an available topic. Available topics: ${valid}.`);
    }

    if (!topicId) {
      const guess = await guessTopic(question);
      if (!guess.confident || !guess.topicId) {
        const valid = readyTopics().map((t) => `\`${t.id}\` — ${t.name}`).join("\n");
        const hint = guess.topicId
          ? `\n\nMy best guess is \`${guess.topicId}\`, but I'm not certain — confirm or pick another.`
          : "";
        return toolText(
          `I'm not sure which topic this fits. Please call ask_grounded again with a "topic" from:\n${valid}${hint}`
        );
      }
      topicId = guess.topicId;
    }

    const topic = getTopicById(topicId)!;
    const answer = await runGroundedAnswer(origin, question, topicId, ctx);
    if (!answer) return toolText("Grounded couldn't produce an answer. Try rephrasing the question.");
    return toolText(`_Answered from Grounded's ${topic.name} sources._\n\n${answer}`);
  }

  return toolText(`Unknown tool: ${name}`);
}

// ---- HTTP handlers ----

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const ctx = await resolveFamily(token);
  // Return 404 (not 401) on a bad token so Claude does not attempt an OAuth flow —
  // this server authenticates purely by the token embedded in the connector URL.
  if (!ctx) return json({ error: "Not found" }, 404);

  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  const { id, method } = body;
  const isNotification = id === undefined || id === null;

  const origin = new URL(request.url).origin;

  try {
    switch (method) {
      case "initialize":
        return rpcResult(id, {
          protocolVersion:
            (body.params?.protocolVersion as string) || PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: "grounded", version: "1.0.0" },
        });

      case "notifications/initialized":
      case "notifications/cancelled":
        return new Response(null, { status: 202, headers: CORS });

      case "ping":
        return rpcResult(id, {});

      case "tools/list":
        return rpcResult(id, { tools: TOOLS });

      case "tools/call": {
        const name = body.params?.name as string;
        const args = (body.params?.arguments as Record<string, unknown>) || {};
        const result = await handleToolCall(name, args, origin, ctx);
        return rpcResult(id, result);
      }

      default:
        if (isNotification) return new Response(null, { status: 202, headers: CORS });
        return rpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return rpcError(id, -32603, message);
  }
}
