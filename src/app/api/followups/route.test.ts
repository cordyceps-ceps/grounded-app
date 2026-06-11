import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Anthropic
const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

process.env.ANTHROPIC_API_KEY = "test-key";

const { POST } = await import("./route");

describe("POST /api/followups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: '["Follow up 1?", "Follow up 2?"]' }],
    });
  });

  it("returns empty followups when question is missing", async () => {
    const req = new Request("http://localhost/api/followups", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.followups).toEqual([]);
  });

  it("returns followups for valid question", async () => {
    const req = new Request("http://localhost/api/followups", {
      method: "POST",
      body: JSON.stringify({
        question: "How often should I feed?",
        answer: "Every 2-3 hours...",
        topicId: "bf",
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.followups).toHaveLength(2);
  });

  it("uses topic name in the prompt", async () => {
    const req = new Request("http://localhost/api/followups", {
      method: "POST",
      body: JSON.stringify({
        question: "Why does my baby wake up?",
        answer: "Sleep cycles...",
        topicId: "sleep",
      }),
    });
    await POST(req);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain("sleep");
  });

  it("limits followups to 2", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: '["Q1?", "Q2?", "Q3?", "Q4?"]' }],
    });
    const req = new Request("http://localhost/api/followups", {
      method: "POST",
      body: JSON.stringify({
        question: "Test?",
        answer: "Answer.",
        topicId: "bf",
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.followups).toHaveLength(2);
  });

  it("returns empty followups on API error", async () => {
    mockCreate.mockRejectedValue(new Error("API Error"));
    const req = new Request("http://localhost/api/followups", {
      method: "POST",
      body: JSON.stringify({
        question: "Test?",
        answer: "Answer.",
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.followups).toEqual([]);
  });

  it("defaults to bf topic when topicId not provided", async () => {
    const req = new Request("http://localhost/api/followups", {
      method: "POST",
      body: JSON.stringify({
        question: "How to latch?",
        answer: "Position baby...",
      }),
    });
    await POST(req);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain("breastfeeding");
  });
});
