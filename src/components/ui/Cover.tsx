interface CoverProps {
  spine: string;
  title?: string;
  w?: number;
  h?: number;
}

const MOTIFS = 6;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const mix = (c: string, other: string, pct: number) =>
  `color-mix(in oklch, ${c} ${100 - pct}%, ${other})`;

function Motif({ n, spine }: { n: number; spine: string }) {
  const light = mix(spine, "white", 62);
  const pale = mix(spine, "white", 82);
  const deep = mix(spine, "black", 38);
  const sun = "oklch(0.81 0.14 83)";
  const clay = "oklch(0.64 0.14 40)";
  switch (n) {
    case 0:
      return (
        <>
          <circle cx="20" cy="30" r="12" fill={sun} />
          <circle cx="25" cy="25" r="11" fill={spine} />
          <path d="M31 14l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill={pale} />
        </>
      );
    case 1:
      return (
        <>
          <circle cx="27" cy="22" r="7" fill={sun} />
          <path d="M5 54V38a15 15 0 0 1 30 0v16z" fill={light} />
          <path d="M13 54V40a7 7 0 0 1 14 0v14z" fill={deep} />
        </>
      );
    case 2:
      return (
        <>
          <rect x="6" y="30" width="11" height="24" fill={light} />
          <rect x="19" y="20" width="11" height="34" fill={clay} />
          <rect x="32" y="34" width="8" height="20" fill={pale} />
        </>
      );
    case 3:
      return (
        <>
          <circle cx="15" cy="26" r="5" fill={sun} />
          <circle cx="26" cy="22" r="4" fill={pale} />
          <path d="M6 32h28a14 14 0 0 1-28 0z" fill={clay} />
        </>
      );
    case 4:
      return (
        <>
          <path d="M20 54V22" stroke={light} strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="14" cy="30" rx="3.4" ry="7" transform="rotate(-38 14 30)" fill={sun} />
          <ellipse cx="26" cy="27" rx="3.4" ry="7" transform="rotate(38 26 27)" fill={pale} />
          <ellipse cx="20" cy="18" rx="3" ry="6" fill={clay} />
        </>
      );
    default:
      return (
        <>
          <circle cx="24" cy="26" r="9" fill={sun} />
          <circle cx="12" cy="62" r="26" fill={light} />
          <circle cx="36" cy="66" r="24" fill={deep} />
        </>
      );
  }
}

export function Cover({ spine, title, w = 40, h = 54 }: CoverProps) {
  const n = hash(title ?? spine) % MOTIFS;
  const showTitle = !!title && w >= 56;
  return (
    <span
      className="shrink-0 relative block overflow-hidden"
      style={{
        width: w,
        height: h,
        borderRadius: Math.max(3, Math.round(w * 0.1)),
        background: spine,
        boxShadow:
          "inset 5px 0 0 rgba(0,0,0,0.14), inset -1px 0 0 rgba(255,255,255,0.08), 0 2px 6px rgba(20,30,24,0.22)",
      }}
    >
      {showTitle && (
        <span
          className="absolute left-0 right-0 top-0 font-display leading-[1.02] text-left"
          style={{
            padding: `${Math.round(w * 0.14)}px ${Math.round(w * 0.1)}px 0 ${Math.round(w * 0.2)}px`,
            fontSize: Math.max(9, Math.round(w * 0.17)),
            color: "oklch(0.97 0.012 88)",
          }}
        >
          {title}
        </span>
      )}
      <svg
        viewBox="0 0 40 54"
        width="100%"
        height="62%"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        focusable="false"
        className="absolute bottom-0 left-0"
      >
        <Motif n={n} spine={spine} />
      </svg>
    </span>
  );
}
