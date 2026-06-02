"use client";

import { ArrowLeft, Leaf } from "lucide-react";
import { IconBtn } from "./IconBtn";

interface TopBarProps {
  onBack?: () => void;
  title?: string;
  logo?: boolean;
  right?: React.ReactNode;
}

export function TopBar({ onBack, title, logo, right }: TopBarProps) {
  return (
    <div
      className="flex items-center gap-3 shrink-0 bg-g-bg z-[6]"
      style={{
        paddingTop: "max(env(safe-area-inset-top, 0px), 12px)",
        paddingLeft: 20,
        paddingRight: 16,
        paddingBottom: 12,
      }}
    >
      {onBack ? (
        <IconBtn icon={ArrowLeft} label="Back" onClick={onBack} />
      ) : logo ? (
        <div className="flex items-center gap-[9px]">
          <div className="w-[30px] h-[30px] rounded-[15px] bg-g-prim text-g-on-prim flex items-center justify-center">
            <Leaf size={16} />
          </div>
          <span className="font-display text-[26px] text-g-ink">Grounded</span>
        </div>
      ) : (
        <div className="w-10" />
      )}

      {title && (
        <div className="flex-1 font-body text-[15px] font-semibold text-g-ink text-center whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </div>
      )}

      <div className={title ? "" : "flex-1"} />

      {right || <div className="w-10" />}
    </div>
  );
}
