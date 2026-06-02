"use client";

import { forwardRef } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";

type Variant = "prim" | "soft" | "ghost" | "panel";
type Size = "lg" | "md" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  icon?: LucideIcon;
  arrow?: boolean;
}

const sizeMap = {
  lg: "h-14 text-base",
  md: "h-[46px] text-base",
  sm: "h-[38px] text-sm",
} as const;

const iconSizeMap = { lg: 19, md: 19, sm: 16 } as const;

const variantMap = {
  prim: "bg-g-prim text-g-on-prim shadow-[var(--g-shadow)]",
  soft: "bg-g-prim-soft text-g-prim",
  ghost: "bg-transparent text-g-ink ring-[1.5px] ring-inset ring-g-line",
  panel: "bg-g-panel text-g-ink shadow-[var(--g-shadow-sm)]",
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "prim", size = "lg", full, icon: Icon, arrow, children, className = "", disabled, ...props }, ref) => {
    const iSize = iconSizeMap[size];
    const pad = arrow ? (size === "sm" ? "px-[38px]" : "px-[44px]") : "px-[22px]";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          relative inline-flex items-center justify-center gap-[9px] rounded-full
          font-body font-bold whitespace-nowrap
          active:scale-[0.97] transition-transform duration-150
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          ${sizeMap[size]} ${variantMap[variant]} ${pad}
          ${full ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {Icon && <Icon size={iSize} />}
        <span>{children}</span>
        {arrow && (
          <ArrowRight
            size={iSize}
            className="absolute top-1/2 -translate-y-1/2"
            style={{ right: size === "sm" ? 14 : 20 }}
          />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
