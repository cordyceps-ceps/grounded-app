"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  icon?: LucideIcon;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, icon: Icon, className = "", ...props }, ref) => {
    return (
      <label className="block">
        {label && (
          <div className="font-body text-[13px] font-semibold text-g-sub mb-[7px]">
            {label}
          </div>
        )}
        <div className="flex items-center gap-[10px] bg-g-panel rounded-[14px] px-[15px] ring-[1.5px] ring-inset ring-g-line">
          {Icon && (
            <span className="text-g-faint shrink-0">
              <Icon size={18} />
            </span>
          )}
          <input
            ref={ref}
            className={`flex-1 border-none outline-none bg-transparent font-body text-base text-g-ink py-[14px] min-w-0 placeholder:text-g-faint ${className}`}
            {...props}
          />
        </div>
      </label>
    );
  }
);

Field.displayName = "Field";
