import { getTopicById } from "@/lib/topics";

export interface AnswerBlock {
  type: "lead" | "h" | "p" | "ol" | "ul" | "video" | "callout";
  text?: string;
  md?: string;
  items?: string[];
  title?: string;
  channel?: string;
  dur?: string;
  videoId?: string;
  thumbnailUrl?: string;
  resource?: { name: string; tel: string };
}

/** Convert inline markdown (bold, italic, links) to HTML */
export function mdInline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--g-prim);text-decoration:underline">$1</a>');
}

/** Parse streamed markdown into typed blocks */
export function parseAnswer(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  const lines = text.split("\n");
  let currentParagraph = "";
  let currentOl: string[] = [];
  let currentUl: string[] = [];
  let isFirst = true;

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      blocks.push({
        type: isFirst ? "lead" : "p",
        md: currentParagraph.trim(),
      });
      isFirst = false;
      currentParagraph = "";
    }
  };

  const flushLists = () => {
    if (currentOl.length > 0) {
      blocks.push({ type: "ol", items: [...currentOl] });
      currentOl = [];
    }
    if (currentUl.length > 0) {
      blocks.push({ type: "ul", items: [...currentUl] });
      currentUl = [];
    }
  };

  const inList = () => currentOl.length > 0 || currentUl.length > 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Video marker
    const videoMatch = trimmed.match(/^:::video\{(.+)\}(?:::)?$/);
    if (videoMatch) {
      flushParagraph();
      flushLists();
      const attrs: Record<string, string> = {};
      const attrRegex = /(\w+)="([^"]*)"/g;
      let m;
      while ((m = attrRegex.exec(videoMatch[1])) !== null) {
        attrs[m[1]] = m[2];
      }
      if (attrs.title) {
        blocks.push({
          type: "video",
          title: attrs.title,
          channel: attrs.channel,
          dur: attrs.dur,
          videoId: attrs.videoId,
          thumbnailUrl: attrs.thumbnailUrl,
        });
      }
      continue;
    }

    // Headings
    if (/^#{1,4}\s+/.test(trimmed)) {
      flushParagraph();
      flushLists();
      blocks.push({ type: "h", text: trimmed.replace(/^#+\s+/, "") });
      continue;
    }

    // Horizontal rules
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushParagraph();
      flushLists();
      continue;
    }

    // Numbered list items
    const listMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (listMatch) {
      flushParagraph();
      if (currentUl.length > 0) flushLists();
      currentOl.push(listMatch[1]);
      continue;
    }

    // Bullet list items
    if (trimmed.startsWith("- ") || trimmed.startsWith("\u2022 ")) {
      flushParagraph();
      if (currentOl.length > 0) flushLists();
      currentUl.push(trimmed.slice(2));
      continue;
    }

    // Blank lines
    if (!trimmed) {
      if (!inList()) {
        flushParagraph();
      }
      continue;
    }

    // Non-blank text while inside a list
    if (inList()) {
      flushLists();
    }

    // Regular paragraph text
    if (currentParagraph) currentParagraph += " ";
    currentParagraph += trimmed;
  }

  flushLists();
  flushParagraph();
  return blocks;
}

/** Extract source book names from the answer text based on topic's authors */
export function extractSources(text: string, topicId?: string): string[] {
  const topic = getTopicById(topicId || "bf");
  if (!topic) return [];
  const sourceSet = new Set<string>();
  for (const s of topic.sources) {
    const words = s.author.split(/\s+/);
    const lastName = words[words.length - 1];
    if (new RegExp(`\\b${lastName}\\b`, "i").test(text)) {
      sourceSet.add(s.author);
    }
  }
  return Array.from(sourceSet);
}
