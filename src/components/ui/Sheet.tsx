"use client";

import { useEffect } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col justify-end"
      style={{ background: "var(--g-overlay)", animation: "g-fade-in 0.2s ease both" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-g-bg rounded-t-[26px] pb-[calc(env(safe-area-inset-bottom)+16px)] px-5 pt-[10px]"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.2)", animation: "g-sheet-up 0.28s cubic-bezier(0.2,0.7,0.3,1) both" }}
      >
        <div className="w-10 h-[5px] rounded-[5px] bg-g-line mx-auto mb-4" />
        {title && (
          <div className="font-display text-[26px] text-g-ink mb-[14px] leading-[1.05]">
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
