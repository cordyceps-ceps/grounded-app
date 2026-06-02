"use client";

interface Option {
  value: string;
  label: string;
}

interface SegmentedProps {
  options: (Option | string)[];
  value: string;
  onChange: (value: string) => void;
}

export function Segmented({ options, value, onChange }: SegmentedProps) {
  return (
    <div className="flex gap-1 bg-g-panel2 rounded-[13px] p-1">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const on = v === value;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`flex-1 border-none cursor-pointer rounded-[10px] py-[9px] px-[6px] font-body text-[13.5px] font-semibold transition-all
              ${on ? "bg-g-panel text-g-ink shadow-[var(--g-shadow-sm)]" : "bg-transparent text-g-sub"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
