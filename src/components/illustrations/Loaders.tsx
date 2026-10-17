interface LoaderProps {
  size?: number;
  className?: string;
}

export function MoonLoader({ size = 44, className }: LoaderProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g className="g-rock">
        <circle cx="30" cy="34" r="19" className="i-sun" />
        <circle cx="38" cy="28" r="17" style={{ fill: "var(--g-bg)" }} />
      </g>
      <path
        d="M50 14l1.6 4.4 4.4 1.6-4.4 1.6L50 26l-1.6-4.4L44 20l4.4-1.6z"
        className="i-clay g-twinkle"
      />
      <path
        d="M14 12l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z"
        className="i-clay g-twinkle"
        style={{ animationDelay: "1.1s" }}
      />
    </svg>
  );
}
