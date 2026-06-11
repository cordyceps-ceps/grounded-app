/**
 * Tests for useAutoScroll — the streaming scroll-lock behavior.
 *
 * This has regressed multiple times. These tests exist to prevent that.
 * If you're changing scroll behavior, run: npx vitest useAutoScroll
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoScroll } from "./useAutoScroll";

function mockScrollContainer(scrollTop = 0, scrollHeight = 2000, clientHeight = 800) {
  const listeners: Record<string, Function[]> = {};
  return {
    scrollTop,
    scrollHeight,
    clientHeight,
    addEventListener: vi.fn((event: string, handler: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    }),
    fire(event: string) {
      for (const h of listeners[event] || []) h(new Event(event));
    },
  };
}

function setup(streaming: boolean) {
  const container = mockScrollContainer();
  const { result, rerender } = renderHook(
    ({ s }: { s: boolean }) => useAutoScroll(s),
    { initialProps: { s: false } }
  );
  Object.defineProperty(result.current.scrollRef, "current", {
    value: container,
    writable: true,
  });
  rerender({ s: streaming });
  return { result, rerender, container };
}

describe("useAutoScroll", () => {
  it("scrolls to bottom by default", () => {
    const { result, container } = setup(true);
    container.scrollTop = 0;

    act(() => result.current.scrollToBottom());

    expect(container.scrollTop).toBe(container.scrollHeight);
  });

  it("does NOT scroll after user touches screen during streaming", () => {
    const { result, container } = setup(true);
    container.scrollTop = 500;

    container.fire("touchstart");

    act(() => result.current.scrollToBottom());

    expect(container.scrollTop).toBe(500);
  });

  it("does NOT scroll after user mousedown during streaming", () => {
    const { result, container } = setup(true);
    container.scrollTop = 500;

    container.fire("mousedown");

    act(() => result.current.scrollToBottom());

    expect(container.scrollTop).toBe(500);
  });

  it("STAYS locked even after multiple scrollToBottom calls", () => {
    const { result, container } = setup(true);
    container.scrollTop = 500;

    container.fire("touchstart");

    // Simulate many streaming tokens arriving
    act(() => result.current.scrollToBottom());
    act(() => result.current.scrollToBottom());
    act(() => result.current.scrollToBottom());

    expect(container.scrollTop).toBe(500);
  });

  it("resetScroll re-enables auto-scrolling (for new messages)", () => {
    const { result, container } = setup(true);
    container.scrollTop = 500;

    container.fire("touchstart");
    act(() => result.current.scrollToBottom());
    expect(container.scrollTop).toBe(500); // locked

    act(() => result.current.resetScroll());

    act(() => result.current.scrollToBottom());
    expect(container.scrollTop).toBe(container.scrollHeight);
  });

  it("touch during non-streaming does NOT lock scroll", () => {
    const { result, container } = setup(false);
    container.scrollTop = 500;

    container.fire("touchstart");

    act(() => result.current.scrollToBottom());

    expect(container.scrollTop).toBe(container.scrollHeight);
  });
});
