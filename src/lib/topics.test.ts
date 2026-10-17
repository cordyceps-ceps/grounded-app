import { describe, it, expect } from "vitest";
import { TOPICS, getTopicById } from "./topics";

describe("TOPICS config", () => {
  it("has at least one topic", () => {
    expect(TOPICS.length).toBeGreaterThan(0);
  });

  it("every topic has required fields", () => {
    for (const t of TOPICS) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.blurb).toBeTruthy();
      expect(typeof t.ready).toBe("boolean");
      expect(t.sources.length).toBeGreaterThan(0);
    }
  });

  it("all topic IDs are unique", () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every source has title, author, and spine color", () => {
    for (const t of TOPICS) {
      for (const s of t.sources) {
        expect(s.title).toBeTruthy();
        expect(s.author).toBeTruthy();
        expect(s.spine).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it("ready topics have at least one source", () => {
    for (const t of TOPICS.filter((t) => t.ready)) {
      expect(t.sources.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("helplines have name and tel", () => {
    for (const t of TOPICS) {
      if (t.helplines) {
        for (const h of t.helplines) {
          expect(h.name).toBeTruthy();
          expect(h.tel).toBeTruthy();
        }
      }
    }
  });

  it("video sources have channel and handle", () => {
    for (const t of TOPICS) {
      if (t.videos) {
        for (const v of t.videos) {
          expect(v.channel).toBeTruthy();
          expect(v.handle).toBeTruthy();
        }
      }
    }
  });
});

describe("getTopicById", () => {
  it("returns the correct topic", () => {
    const bf = getTopicById("bf");
    expect(bf).toBeDefined();
    expect(bf!.name).toBe("Breastfeeding");
  });

  it("returns undefined for unknown ID", () => {
    expect(getTopicById("nonexistent")).toBeUndefined();
  });

  it("returns correct topic for each known ID", () => {
    for (const t of TOPICS) {
      const found = getTopicById(t.id);
      expect(found).toBe(t);
    }
  });
});

describe("topic hues", () => {
  const HUES = ["rose", "sky", "lilac", "sun", "sage", "peach"];
  it("every topic has a known hue", () => {
    for (const t of TOPICS) expect(HUES).toContain(t.hue);
  });
  it("ready topics have distinct hues", () => {
    const ready = TOPICS.filter((t) => t.ready && !t.hidden).map((t) => t.hue);
    expect(new Set(ready).size).toBe(ready.length);
  });
});

describe("ask anything helpers", () => {
  it("searchableTopics are ready and not hidden", async () => {
    const { searchableTopics } = await import("./topics");
    const ids = searchableTopics().map((t) => t.id);
    expect(ids).toEqual(["bf", "sleep", "develop"]);
  });

  it("extractSources(all) finds authors across topics and topicsFromSources groups them", async () => {
    const { extractSources } = await import("./parseAnswer");
    const { topicsFromSources } = await import("./topics");
    const text = "According to Weissbluth, naps matter. Huggins says night feeds matter. Barker agrees.";
    const sources = extractSources(text, "all");
    expect(sources).toEqual(expect.arrayContaining(["Marc Weissbluth", "Kathleen Huggins", "Robin Barker"]));
    expect(topicsFromSources(sources).map((t) => t.id).sort()).toEqual(["bf", "develop", "sleep"]);
  });

  it("single-topic extractSources is unchanged by the all path", async () => {
    const { extractSources } = await import("./parseAnswer");
    expect(extractSources("Weissbluth and Huggins", "bf")).toEqual(["Kathleen Huggins"]);
  });
});
