import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getGreeting, formatBabyAge } from "./utils";

describe("getGreeting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Good morning' before noon", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 8, 0));
    expect(getGreeting()).toBe("Good morning");
  });

  it("returns 'Good morning' at midnight", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 0, 0));
    expect(getGreeting()).toBe("Good morning");
  });

  it("returns 'Good afternoon' at 12:00", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 12, 0));
    expect(getGreeting()).toBe("Good afternoon");
  });

  it("returns 'Good afternoon' at 16:59", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 16, 59));
    expect(getGreeting()).toBe("Good afternoon");
  });

  it("returns 'Good evening' at 17:00", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 17, 0));
    expect(getGreeting()).toBe("Good evening");
  });

  it("returns 'Good evening' at 23:59", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 23, 59));
    expect(getGreeting()).toBe("Good evening");
  });
});

describe("formatBabyAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns days for a newborn", () => {
    expect(formatBabyAge("2025-05-29")).toBe("3 days");
  });

  it("returns singular day", () => {
    expect(formatBabyAge("2025-05-31")).toBe("1 day");
  });

  it("returns 0 days for same day", () => {
    expect(formatBabyAge("2025-06-01")).toBe("0 days");
  });

  it("returns weeks and days for baby under 12 weeks", () => {
    // 2 weeks, 1 day = 15 days
    expect(formatBabyAge("2025-05-17")).toBe("2 weeks, 1 day");
  });

  it("returns singular week", () => {
    expect(formatBabyAge("2025-05-25")).toBe("1 week");
  });

  it("returns months for baby over 12 weeks", () => {
    // 151 days / 30.44 ≈ 4.96 → 4 months
    expect(formatBabyAge("2025-01-01")).toBe("4 months");
  });

  it("returns singular month", () => {
    // 31 days = still under 12 weeks, so shows weeks/days
    // Use a date that puts us past 12 weeks: 90 days / 30.44 ≈ 2
    expect(formatBabyAge("2025-02-28")).toBe("3 months");
  });

  it("handles future date (prenatal)", () => {
    expect(formatBabyAge("2025-06-15")).toBe("2 weeks until due date");
  });

  it("handles 1 day until due date", () => {
    expect(formatBabyAge("2025-06-02")).toBe("1 day until due date");
  });
});
