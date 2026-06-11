import { describe, it, expect } from "vitest";
import { parseAnswer, extractSources, mdInline, type AnswerBlock } from "./parseAnswer";

describe("mdInline", () => {
  it("escapes HTML entities", () => {
    expect(mdInline("a < b & c > d")).toBe("a &lt; b &amp; c &gt; d");
  });

  it("converts bold markdown", () => {
    expect(mdInline("**bold**")).toBe("<strong>bold</strong>");
  });

  it("converts italic markdown", () => {
    expect(mdInline("*italic*")).toBe("<em>italic</em>");
  });

  it("converts links", () => {
    const result = mdInline("[text](https://example.com)");
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain(">text</a>");
  });

  it("handles mixed inline formatting", () => {
    const result = mdInline("Try **this** and *that*");
    expect(result).toContain("<strong>this</strong>");
    expect(result).toContain("<em>that</em>");
  });
});

describe("parseAnswer", () => {
  it("returns empty array for empty string", () => {
    expect(parseAnswer("")).toEqual([]);
  });

  it("marks first paragraph as 'lead'", () => {
    const blocks = parseAnswer("First paragraph here.");
    expect(blocks[0].type).toBe("lead");
    expect(blocks[0].md).toBe("First paragraph here.");
  });

  it("marks subsequent paragraphs as 'p'", () => {
    const blocks = parseAnswer("First paragraph.\n\nSecond paragraph.");
    expect(blocks[0].type).toBe("lead");
    expect(blocks[1].type).toBe("p");
  });

  it("parses headings", () => {
    const blocks = parseAnswer("Intro text\n\n## My heading\n\nMore text");
    const heading = blocks.find((b) => b.type === "h");
    expect(heading).toBeDefined();
    expect(heading!.text).toBe("My heading");
  });

  it("parses numbered lists", () => {
    const blocks = parseAnswer("Steps:\n\n1. First\n2. Second\n3. Third");
    const ol = blocks.find((b) => b.type === "ol");
    expect(ol).toBeDefined();
    expect(ol!.items).toEqual(["First", "Second", "Third"]);
  });

  it("parses bullet lists", () => {
    const blocks = parseAnswer("Options:\n\n- Alpha\n- Beta\n- Gamma");
    const ul = blocks.find((b) => b.type === "ul");
    expect(ul).toBeDefined();
    expect(ul!.items).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("parses video markers", () => {
    const blocks = parseAnswer(
      ':::video{title="Test Video" channel="TestCh" dur="5:30" videoId="abc123" thumbnailUrl="https://img.com/thumb.jpg"}'
    );
    const video = blocks.find((b) => b.type === "video");
    expect(video).toBeDefined();
    expect(video!.title).toBe("Test Video");
    expect(video!.channel).toBe("TestCh");
    expect(video!.dur).toBe("5:30");
    expect(video!.videoId).toBe("abc123");
    expect(video!.thumbnailUrl).toBe("https://img.com/thumb.jpg");
  });

  it("ignores horizontal rules", () => {
    const blocks = parseAnswer("Before\n\n---\n\nAfter");
    expect(blocks.every((b) => b.type !== "h")).toBe(true);
    expect(blocks.length).toBe(2); // lead + p
  });

  it("handles mixed content", () => {
    const md = `First paragraph.

## Section

1. Step one
2. Step two

A follow-up note.

- Bullet A
- Bullet B`;
    const blocks = parseAnswer(md);
    const types = blocks.map((b) => b.type);
    expect(types).toContain("lead");
    expect(types).toContain("h");
    expect(types).toContain("ol");
    expect(types).toContain("p");
    expect(types).toContain("ul");
  });

  it("joins wrapped paragraph lines", () => {
    const blocks = parseAnswer("This is a long\nparagraph that wraps.");
    expect(blocks[0].md).toBe("This is a long paragraph that wraps.");
  });
});

describe("extractSources", () => {
  it("extracts breastfeeding sources by author last name", () => {
    const text = "According to Huggins, this is normal. Mohrbacher agrees.";
    const sources = extractSources(text, "bf");
    expect(sources).toContain("Kathleen Huggins");
    expect(sources).toContain("Nancy Mohrbacher");
  });

  it("returns empty array for unknown topic", () => {
    expect(extractSources("anything", "nonexistent")).toEqual([]);
  });

  it("extracts sleep sources", () => {
    const text = "Ferber recommends graduated intervals. Karp's 5 S's technique helps newborns.";
    const sources = extractSources(text, "sleep");
    expect(sources).toContain("Richard Ferber");
    expect(sources).toContain("Harvey Karp");
  });

  it("returns empty when no authors mentioned", () => {
    const sources = extractSources("No author names here at all.", "bf");
    expect(sources).toEqual([]);
  });

  it("is case insensitive for author matching", () => {
    const sources = extractSources("HUGGINS says...", "bf");
    expect(sources).toContain("Kathleen Huggins");
  });

  it("defaults to bf topic when topicId not provided", () => {
    const sources = extractSources("Huggins mentions this.");
    expect(sources).toContain("Kathleen Huggins");
  });
});
