import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase SSR
const mockGetSession = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

const { middleware } = await import("./middleware");

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${path}`));
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("root redirect", () => {
    it("redirects authenticated user from / to /home", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: "user-1" } } },
      });
      const res = await middleware(makeRequest("/"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/home");
    });

    it("redirects unauthenticated user from / to /onboarding/welcome", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      const res = await middleware(makeRequest("/"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/onboarding/welcome");
    });
  });

  describe("public paths", () => {
    it("allows /onboarding paths through", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      const res = await middleware(makeRequest("/onboarding/welcome"));
      expect(res.status).toBe(200);
    });

    it("allows /auth paths through", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      const res = await middleware(makeRequest("/auth/callback"));
      expect(res.status).toBe(200);
    });

    it("allows /api paths through", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      const res = await middleware(makeRequest("/api/chat"));
      expect(res.status).toBe(200);
    });
  });

  describe("protected routes", () => {
    it("redirects unauthenticated user to onboarding", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      const res = await middleware(makeRequest("/home"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/onboarding/welcome");
    });

    it("allows authenticated user through to protected routes", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: "user-1" } } },
      });
      const res = await middleware(makeRequest("/home"));
      expect(res.status).toBe(200);
    });

    it("allows authenticated user to access /settings", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: "user-1" } } },
      });
      const res = await middleware(makeRequest("/settings"));
      expect(res.status).toBe(200);
    });
  });
});
