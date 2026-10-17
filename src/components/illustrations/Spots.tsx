import type { SVGProps } from "react";

type SpotProps = SVGProps<SVGSVGElement>;

function Spot({ children, ...props }: SpotProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

export function SpotConversations(props: SpotProps) {
  return (
    <Spot {...props}>
      <circle cx="146" cy="52" r="24" className="i-sun" />
      <path d="M26 138l70-12V62L26 74z" className="i-light" />
      <path d="M104 126l70 12V74l-70-12z" className="i-sky" />
      <g strokeWidth="3" strokeLinecap="round" className="s-mid" opacity=".55">
        <path d="M40 92l44-7" />
        <path d="M40 106l44-7" />
        <path d="M116 85l44 7" />
        <path d="M116 99l44 7" />
      </g>
      <path d="M164 140v-26" stroke="var(--g-ill-mid)" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="156" cy="118" rx="4.5" ry="10" transform="rotate(-40 156 118)" className="i-mid" />
      <ellipse cx="172" cy="116" rx="4.5" ry="10" transform="rotate(40 172 116)" className="i-mid" />
    </Spot>
  );
}

export function SpotFacts(props: SpotProps) {
  return (
    <Spot {...props}>
      <circle cx="152" cy="46" r="22" className="i-sun" />
      <rect x="48" y="30" width="96" height="112" rx="9" transform="rotate(-5 96 86)" className="i-light" />
      <rect x="48" y="30" width="14" height="112" rx="7" transform="rotate(-5 96 86)" className="i-clay" />
      <g strokeWidth="3.5" strokeLinecap="round" className="s-mid" opacity=".55" transform="rotate(-5 96 86)">
        <path d="M78 58h48" />
        <path d="M78 74h48" />
        <path d="M78 90h30" />
      </g>
      <path d="M100 124v-16" stroke="var(--g-ill-mid)" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="93" cy="108" rx="4.5" ry="9" transform="rotate(-40 93 108)" className="i-mid" />
      <ellipse cx="107" cy="106" rx="4.5" ry="9" transform="rotate(40 107 106)" className="i-mid" />
    </Spot>
  );
}

export function SpotCurating(props: SpotProps) {
  return (
    <Spot {...props}>
      <circle cx="150" cy="48" r="26" className="i-sun" />
      <rect x="40" y="108" width="100" height="22" rx="4" className="i-sky" />
      <rect x="48" y="86" width="86" height="22" rx="4" className="i-rose" />
      <rect x="38" y="64" width="98" height="22" rx="4" className="i-lilac" />
      <g strokeWidth="3" strokeLinecap="round" className="s-deep" opacity=".3">
        <path d="M56 119h40" />
        <path d="M62 97h34" />
        <path d="M52 75h42" />
      </g>
      <g transform="rotate(12 120 52)">
        <rect x="104" y="32" width="38" height="26" rx="4" className="i-light" />
        <rect x="104" y="32" width="38" height="8" rx="4" className="i-clay" />
      </g>
    </Spot>
  );
}

export function SpotTimeline(props: SpotProps) {
  return (
    <Spot {...props}>
      <circle cx="40" cy="40" r="18" className="i-sun" />
      <g strokeWidth="4" strokeLinecap="round" className="s-mid">
        <path d="M50 140v-24" />
        <path d="M100 140V84" />
        <path d="M150 140V50" />
      </g>
      <g className="i-clay">
        <ellipse cx="42" cy="118" rx="5" ry="11" transform="rotate(-42 42 118)" />
        <ellipse cx="58" cy="114" rx="5" ry="11" transform="rotate(42 58 114)" />
      </g>
      <g className="i-sun">
        <ellipse cx="86" cy="94" rx="6" ry="14" transform="rotate(-44 86 94)" />
        <ellipse cx="114" cy="90" rx="6" ry="14" transform="rotate(44 114 90)" />
        <ellipse cx="100" cy="72" rx="5" ry="12" />
      </g>
      <g className="i-light">
        <ellipse cx="132" cy="68" rx="7" ry="17" transform="rotate(-44 132 68)" />
        <ellipse cx="168" cy="62" rx="7" ry="17" transform="rotate(44 168 62)" />
        <ellipse cx="150" cy="36" rx="6" ry="14" />
      </g>
      <path d="M0 160v-16c46-12 100-12 200 0v16z" className="i-deep" />
    </Spot>
  );
}
