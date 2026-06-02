interface KickerProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Kicker({ children, color, className = "" }: KickerProps) {
  return (
    <div
      className={`font-body text-[11.5px] font-bold tracking-[1px] uppercase ${className}`}
      style={{ color: color || "var(--g-faint)" }}
    >
      {children}
    </div>
  );
}
