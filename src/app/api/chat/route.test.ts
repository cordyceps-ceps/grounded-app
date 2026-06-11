import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Anthropic — store the text callback so we can call it synchronously
let textCallback: ((text: string) => void) | null = null;
const mockStream = {
  on: vi.fn().mockImplementation((event: string, cb: (text: string) => void) => {
    if (event === "text") textCallback = cb;
    return mockStream;
  }),
  finalMessage: vi.fn().mockImplementation(async () => {
    // Emit text synchronously before resolving
    if (textCallback) {
      textCallback("Hello world");
      textCallback = null;
    }
    return {};
  }),
};
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        stream: vi.fn().mockReturnValue(mockStream),
        create: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: '["keyword1", "keyword2"]' }],
        }),
      };
    },
  };
});

// Mock OpenAI
vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      embeddings = {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }],
        }),
      };
    },
  };
});

// Mock Supabase
const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
    from: vi.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
    })),
  })),
}));

// Set env vars before importing route
process.env.ANTHROPIC_API_KEY = "test-key";
process.env.OPENAI_API_KEY = "test-key";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

const { POST } = await import("./route");

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    textCallback = null;
    // Re-setup the on mock for each test
    mockStream.on.mockImplementation((event: string, cb: (text: string) => void) => {
      if (event === "text") textCallback = cb;
      return mockStream;
    });
    mockStream.finalMessage.mockImplementation(async () => {
      if (textCallback) {
        textCallback("Hello world");
        textCallback = null;
      }
      return {};
    });
  });

  it("returns 400 when message is missing", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Message is required");
  });

  it("returns 400 when message is not a string", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: 123 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns SSE stream for valid message", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: "How do I latch?",
        topicId: "bf",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("runs semantic and keyword search in parallel", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: "When should I start solids?",
        topicId: "bf",
      }),
    });
    await POST(req);
    // Should call rpc for search functions
    expect(mockRpc).toHaveBeenCalled();
  });

  it("defaults topicId to 'bf' when not provided", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Help with latching" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
