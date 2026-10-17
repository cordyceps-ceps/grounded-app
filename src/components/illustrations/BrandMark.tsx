interface BrandMarkProps {
  size?: number;
  className?: string;
}

const MOSS = "oklch(0.37 0.05 160)";
const CREAM = "oklch(0.97 0.012 88)";
const SUN = "oklch(0.81 0.14 83)";
const CLAY = "oklch(0.64 0.14 40)";

export function BrandMark({ size = 30, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="48" height="48" rx="14" fill={MOSS} />
      <path d="M24 39V19" stroke={CREAM} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="16" cy="21" rx="5" ry="9.5" transform="rotate(-36 16 21)" fill={CLAY} />
      <ellipse cx="32" cy="18" rx="5" ry="9.5" transform="rotate(36 32 18)" fill={CREAM} />
      <ellipse cx="24" cy="12" rx="4.2" ry="7" fill={SUN} />
    </svg>
  );
}
