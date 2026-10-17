import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./systemPrompt";

describe("buildSystemPrompt", () => {
  it("includes topic name", () => {
    const prompt = buildSystemPrompt("bf");
    expect(prompt).toContain("breastfeeding");
  });

  it("includes source books", () => {
    const prompt = buildSystemPrompt("bf");
    expect(prompt).toContain("Nursing Mother");
    expect(prompt).toContain("Kathleen Huggins");
  });

  it("includes baby context when provided", () => {
    const prompt = buildSystemPrompt("bf", {
      name: "Luna",
      gender: "girl",
      age: "3 weeks",
      born: true,
    });
    expect(prompt).toContain("Luna");
    expect(prompt).toContain("3 weeks old");
    expect(prompt).toContain("she/her");
  });

  it("uses they/them for unspecified gender", () => {
    const prompt = buildSystemPrompt("bf", {
      name: "Baby",
      age: "2 months",
      born: true,
    });
    expect(prompt).toContain("they/them");
  });

  it("handles prenatal context", () => {
    const prompt = buildSystemPrompt("bf", {
      name: "Bean",
      gender: "boy",
      age: "32 weeks",
      born: false,
    });
    expect(prompt).toContain("expecting");
    expect(prompt).toContain("prenatal");
  });

  it("includes topic facts", () => {
    const prompt = buildSystemPrompt("bf", undefined, [
      "Currently cluster feeding",
      "Using nipple shields",
    ]);
    expect(prompt).toContain("Currently cluster feeding");
    expect(prompt).toContain("Using nipple shields");
  });

  it("includes global facts with label", () => {
    const prompt = buildSystemPrompt("bf", undefined, [], [
      "Born via C-section",
    ]);
    expect(prompt).toContain("Born via C-section (general)");
  });

  it("includes helplines for topics that have them", () => {
    const prompt = buildSystemPrompt("bf");
    expect(prompt).toContain("National Breastfeeding Helpline");
    expect(prompt).toContain("0300 100 0212");
  });

  it("includes promptGuidance for sleep topic", () => {
    const prompt = buildSystemPrompt("sleep");
    expect(prompt).toContain("SLEEP-SPECIFIC GUIDANCE");
    expect(prompt).toContain("Weissbluth");
    expect(prompt).toContain("Ferber");
  });

  it("falls back to 'parenting' for unknown topic", () => {
    const prompt = buildSystemPrompt("nonexistent");
    expect(prompt).toContain("parenting");
  });

  it("includes fact relevance guidance", () => {
    const prompt = buildSystemPrompt("bf", undefined, ["some fact"]);
    expect(prompt).toContain("Only reference a fact if it is directly relevant");
  });

  it("includes citation format guidance", () => {
    const prompt = buildSystemPrompt("bf");
    expect(prompt).toContain("According to");
  });
});

describe("buildSystemPrompt (all topics)", () => {
  const prompt = buildSystemPrompt("all", undefined, ["[Sleep] Naps in the pram"], ["Born at 38 weeks"]);

  it("lists books from every searchable topic, grouped", () => {
    expect(prompt).toContain("Breastfeeding:");
    expect(prompt).toContain("Sleep:");
    expect(prompt).toContain("Kathleen Huggins");
    expect(prompt).toContain("Marc Weissbluth");
  });

  it("excludes hidden topics", () => {
    expect(prompt).not.toContain("WEEK-BY-WEEK GUIDANCE");
    expect(prompt).not.toContain("Week by week:");
  });

  it("keeps per-topic guidance such as the sleep philosophies rule", () => {
    expect(prompt).toContain("SLEEP-SPECIFIC GUIDANCE");
  });

  it("carries topic-labelled and general facts", () => {
    expect(prompt).toContain("[Sleep] Naps in the pram");
    expect(prompt).toContain("Born at 38 weeks (general)");
  });

  it("asks for short answers and no topic redirect", () => {
    expect(prompt).toContain("under 250 words");
  });
});
