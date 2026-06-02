"use client";

import type { LucideIcon } from "lucide-react";

interface IconBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: "panel" | "prim" | "soft";
  size?: number;
  iconSize?: number;
}

export function IconBtn({
  icon: Icon,
  label,
  variant = "panel",
  size = 40,
  iconSize = 18,
  className = "",
  ...props
}: IconBtnProps) {
  const styles = {
    panel: "bg-g-panel text-g-sub shadow-[var(--g-shadow-sm)]",
    prim: "bg-g-prim text-g-on-prim",
    soft: "bg-g-prim-soft text-g-prim",
  } as const;

  return (
    <button
      aria-label={label}
      className={`flex items-center justify-center rounded-full border-none cursor-pointer shrink-0 ${styles[variant]} ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <Icon size={iconSize} />
    </button>
  );
}
