interface DotsProps {
  total: number;
  current: number;
}

export function Dots({ total, current }: DotsProps) {
  return (
    <div className="flex gap-[6px]">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-[6px] rounded-[3px] transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            background: i === current ? "var(--g-prim)" : "var(--g-line)",
          }}
        />
      ))}
    </div>
  );
}
