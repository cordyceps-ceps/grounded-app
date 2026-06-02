interface CoverProps {
  spine: string;
  w?: number;
  h?: number;
}

export function Cover({ spine, w = 40, h = 54 }: CoverProps) {
  return (
    <span
      className="shrink-0 flex flex-col justify-end"
      style={{
        width: w,
        height: h,
        borderRadius: 4,
        background: spine,
        boxShadow: "inset -4px 0 0 rgba(0,0,0,0.16), 0 2px 5px rgba(0,0,0,0.22)",
        padding: `0 5px 6px`,
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          width: Math.max(10, w * 0.34),
          height: 2,
          borderRadius: 2,
          background: "rgba(255,255,255,0.5)",
        }}
      />
    </span>
  );
}
