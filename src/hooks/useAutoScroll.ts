import { useRef, useEffect, useCallback } from "react";

/**
 * Auto-scroll to bottom during streaming, but STOP if the user scrolls up.
 *
 * DO NOT modify this logic without updating useAutoScroll.test.ts.
 * This has been a recurring regression — the test exists to catch it.
 *
 * The approach is intentionally simple to avoid race conditions:
 * - Once the user touches/clicks during streaming → stop auto-scrolling
 * - Only resume when resetScroll() is called (i.e. user sends a new message)
 * - No "detect if back at bottom" logic — that causes races on mobile
 */
export function useAutoScroll(streaming: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    const s = scrollRef.current;
    if (!s) return;

    // Any user interaction during streaming locks scroll immediately
    const lock = () => {
      if (streaming) userScrolledUp.current = true;
    };

    s.addEventListener("touchstart", lock, { passive: true });
    s.addEventListener("mousedown", lock);
    return () => {
      s.removeEventListener("touchstart", lock);
      s.removeEventListener("mousedown", lock);
    };
  }, [streaming]);

  const scrollToBottom = useCallback(() => {
    const s = scrollRef.current;
    if (s && !userScrolledUp.current) {
      s.scrollTop = s.scrollHeight;
    }
  }, []);

  const resetScroll = useCallback(() => {
    userScrolledUp.current = false;
  }, []);

  return { scrollRef, scrollToBottom, resetScroll };
}
