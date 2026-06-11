import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { timeAgo } from "./format";

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns minutes for recent times", () => {
    expect(timeAgo("2025-06-01T11:45:00Z")).toBe("15m ago");
  });

  it("returns 0m for just now", () => {
    expect(timeAgo("2025-06-01T12:00:00Z")).toBe("0m ago");
  });

  it("returns hours within the same day", () => {
    expect(timeAgo("2025-06-01T09:00:00Z")).toBe("3h ago");
  });

  it("returns 'Yesterday' for 1 day ago", () => {
    expect(timeAgo("2025-05-31T12:00:00Z")).toBe("Yesterday");
  });

  it("returns days for 2-6 days ago", () => {
    expect(timeAgo("2025-05-29T12:00:00Z")).toBe("3 days ago");
  });

  it("returns weeks for 7+ days ago", () => {
    expect(timeAgo("2025-05-18T12:00:00Z")).toBe("2w ago");
  });

  it("returns 1w for exactly 7 days", () => {
    expect(timeAgo("2025-05-25T12:00:00Z")).toBe("1w ago");
  });
});
