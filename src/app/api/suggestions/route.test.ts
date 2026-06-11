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

// Mock Supabase
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: mockUpsert,
    })),
  })),
}));

process.env.ANTHROPIC_API_KEY = "test-key";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

const { POST } = await import("./route");

describe("POST /api/suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: '["Q1?", "Q2?", "Q3?"]' }],
    });
  });

  it("returns 400 when family_id is missing", async () => {
    const req = new Request("http://localhost/api/suggestions", {
      method: "POST",
      body: JSON.stringify({ topic_id: "bf" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when topic_id is missing", async () => {
    const req = new Request("http://localhost/api/suggestions", {
      method: "POST",
      body: JSON.stringify({ family_id: "fam-123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns questions for valid request", async () => {
    const req = new Request("http://localhost/api/suggestions", {
      method: "POST",
      body: JSON.stringify({
        family_id: "fam-123",
        topic_id: "bf",
        baby: { name: "Luna", age: "3 weeks", gender: "girl" },
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.questions).toHaveLength(3);
  });

  it("upserts suggestions to database", async () => {
    const req = new Request("http://localhost/api/suggestions", {
      method: "POST",
      body: JSON.stringify({
        family_id: "fam-123",
        topic_id: "bf",
      }),
    });
    await POST(req);
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("uses topic name in the prompt", async () => {
    const req = new Request("http://localhost/api/suggestions", {
      method: "POST",
      body: JSON.stringify({
        family_id: "fam-123",
        topic_id: "sleep",
      }),
    });
    await POST(req);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain("sleep");
  });

  it("excludes recent questions from suggestions", async () => {
    const req = new Request("http://localhost/api/suggestions", {
      method: "POST",
      body: JSON.stringify({
        family_id: "fam-123",
        topic_id: "bf",
        recent_questions: ["How to latch?", "Is cluster feeding normal?"],
      }),
    });
    await POST(req);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain("How to latch?");
    expect(callArgs.messages[0].content).toContain("Do NOT repeat");
  });

  it("returns empty questions on API error", async () => {
    mockCreate.mockRejectedValue(new Error("API Error"));
    const req = new Request("http://localhost/api/suggestions", {
      method: "POST",
      body: JSON.stringify({
        family_id: "fam-123",
        topic_id: "bf",
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.questions).toEqual([]);
  });
});
