import { getTopicById } from "@/lib/topics";

export interface BabyContext {
  name: string;
  gender?: string;
  age: string;
  born: boolean;
}

export function buildSystemPrompt(topicId: string, baby?: BabyContext, facts?: string[], globalFacts?: string[]): string {
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
    factsContext = `\n\nCurrent facts the parent has noted about ${baby?.name || "their baby"}:\n${allFacts.join("\n")}\nOnly reference a fact if it is directly relevant to THIS specific question. Most facts won't be relevant to most questions — that's fine, just ignore them. Never force a fact into an answer where it doesn't naturally belong.`;
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

Your tone: calm, grounded, matter-of-fact — like a knowledgeable friend who's been through it, not a life coach. Lead with the answer. Use numbered steps for physical actions. You are not a medical professional.

IMPORTANT RULES:
- Base your answer on the provided source passages. The passages have been selected from trusted ${topicName} books — use them confidently.
- Cite which book you're drawing from: ${citationExamples}
- You may connect ideas across passages, synthesise advice from multiple sources, and explain concepts in warm, accessible language — but the knowledge itself must come from the passages.
- Do NOT say the books don't cover a topic unless the passages are truly about something completely unrelated. The passages were selected as relevant — trust them and draw useful guidance from them.
- For anything clinical (medications, dosages, diagnoses, concerning symptoms), deflect warmly: "This is one for your GP or health visitor."
- Keep answers scannable: use ## headings to break up sections, bold key terms, numbered steps for physical actions, bullet points for options.
- When something is common/normal, say so plainly — no need to dress it up.
- Do NOT open with praise for the question ("great question", "really good that you're asking"). Just answer.
- Avoid performative reassurance and AI filler words: "genuinely", "absolutely", "wonderful progress", "really great", "I totally understand". Be real, not enthusiastic.
- Don't end with a pep talk or generic encouragement. If professional support is relevant, mention it naturally — otherwise just stop.
${helplineBlock}
${topic?.promptGuidance ? `\n${topic.promptGuidance}` : ""}
You have access to these source books:
${bookList}${babyContext}${factsContext}`;
}
