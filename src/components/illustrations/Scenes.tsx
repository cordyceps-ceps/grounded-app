import type { SVGProps } from "react";

type SceneProps = SVGProps<SVGSVGElement>;

function Scene({ children, ...props }: SceneProps) {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
      {...props}
    >
      <rect width="320" height="220" className="i-bg" />
      {children}
    </svg>
  );
}

const star = (x: number, y: number, r: number) =>
  `M${x} ${y - r}l${r * 0.3} ${r * 0.7} ${r * 0.7} ${r * 0.3}-${r * 0.7} ${r * 0.3}-${r * 0.3} ${r * 0.7}-${r * 0.3}-${r * 0.7}-${r * 0.7}-${r * 0.3} ${r * 0.7}-${r * 0.3}z`;

function Sprig({ x, base = 206, h = 74, flip = false }: { x: number; base?: number; h?: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  const top = base - h;
  return (
    <g>
      <path
        d={`M${x} ${base}V${top}`}
        strokeWidth="5"
        strokeLinecap="round"
        className="s-mid"
      />
      <ellipse cx={x - 14 * s} cy={top + h * 0.42} rx="6.5" ry="15" transform={`rotate(${-40 * s} ${x - 14 * s} ${top + h * 0.42})`} className="i-mid" />
      <ellipse cx={x + 14 * s} cy={top + h * 0.32} rx="6.5" ry="15" transform={`rotate(${40 * s} ${x + 14 * s} ${top + h * 0.32})`} className="i-mid" />
      <ellipse cx={x} cy={top - 2} rx="5.5" ry="13" className="i-mid" />
    </g>
  );
}

export function SceneTogether(props: SceneProps) {
  return (
    <Scene {...props}>
      <circle cx="238" cy="80" r="46" className="i-sun" />
      <Sprig x={44} h={76} />
      <path d="M92 206v-54a52 52 0 0 1 104 0v54z" className="i-clay" />
      <circle cx="144" cy="88" r="21" className="i-skin" />
      <path d="M123 86a21 21 0 0 1 42 0z" className="i-rose" />
      <circle cx="144" cy="63" r="5.5" className="i-light" />
      <g transform="rotate(-10 196 182)">
        <rect x="160" y="160" width="70" height="46" rx="23" className="i-light" />
        <circle cx="214" cy="170" r="16" className="i-skin" />
        <path d="M198 170a16 16 0 0 1 32 0z" className="i-lilac" />
      </g>
      <rect x="262" y="192" width="50" height="14" rx="3" className="i-sky" />
      <rect x="266" y="178" width="42" height="14" rx="3" className="i-rose" />
      <rect x="260" y="164" width="52" height="14" rx="3" className="i-light" />
      <rect y="206" width="320" height="14" className="i-mid" opacity=".5" />
    </Scene>
  );
}

export function SceneBooks(props: SceneProps) {
  const books = [
    { x: 74, h: 122, c: "i-clay" },
    { x: 104, h: 98, c: "i-sky" },
    { x: 134, h: 138, c: "i-light" },
    { x: 164, h: 106, c: "i-rose" },
    { x: 194, h: 86, c: "i-lilac" },
  ];
  return (
    <Scene {...props}>
      <circle cx="272" cy="58" r="28" className="i-sun" />
      <Sprig x={38} h={70} />
      {books.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={206 - b.h} width="28" height={b.h} rx="4" className={b.c} />
          <rect x={b.x} y={206 - b.h + 16} width="28" height="4" className="i-bg" opacity=".35" />
          <rect x={b.x} y={206 - b.h + 24} width="28" height="2.5" className="i-bg" opacity=".35" />
        </g>
      ))}
      <g transform="rotate(16 248 206)">
        <rect x="234" y="112" width="28" height="94" rx="4" className="i-sun" />
        <rect x="234" y="128" width="28" height="4" className="i-bg" opacity=".35" />
      </g>
      <rect y="206" width="320" height="14" className="i-mid" opacity=".5" />
    </Scene>
  );
}

export function SceneBaby(props: SceneProps) {
  return (
    <Scene {...props}>
      <circle cx="244" cy="82" r="38" className="i-sun" />
      <circle cx="260" cy="70" r="34" className="i-bg" />
      <path d={star(206, 48, 12)} className="i-light g-twinkle" />
      <path d={star(282, 130, 8)} className="i-light g-twinkle" style={{ animationDelay: "1.2s" }} />
      <path d={star(54, 60, 9)} className="i-light g-twinkle" style={{ animationDelay: ".6s" }} />
      <Sprig x={44} h={64} />
      <circle cx="148" cy="136" r="31" className="i-skin" />
      <path d="M117 136a31 31 0 0 1 62 0z" className="i-lilac" />
      <ellipse cx="148" cy="202" rx="82" ry="48" className="i-light" />
      <circle cx="112" cy="186" r="5" className="i-rose" />
      <circle cx="148" cy="178" r="5" className="i-sky" />
      <circle cx="184" cy="186" r="5" className="i-sun" />
      <rect y="206" width="320" height="14" className="i-mid" opacity=".5" />
    </Scene>
  );
}

export function SceneQuestion(props: SceneProps) {
  return (
    <Scene {...props}>
      <path d={star(54, 70, 11)} className="i-sun g-twinkle" />
      <path d={star(268, 96, 9)} className="i-light g-twinkle" style={{ animationDelay: "1s" }} />
      <rect x="112" y="26" width="96" height="54" rx="27" className="i-clay" />
      <path d="M146 78l-8 22 28-22z" className="i-clay" />
      <circle cx="140" cy="53" r="6" className="i-light" />
      <circle cx="160" cy="53" r="6" className="i-light" />
      <circle cx="180" cy="53" r="6" className="i-light" />
      <path d="M52 198l104-16v-76l-104 14z" className="i-light" />
      <path d="M164 182l104 16v-78l-104-14z" className="i-sky" />
      <g strokeWidth="3" strokeLinecap="round" className="s-mid" opacity=".6">
        <path d="M70 134l70-10" />
        <path d="M70 150l70-10" />
        <path d="M70 166l50-8" />
        <path d="M180 124l70 10" />
        <path d="M180 140l70 10" />
        <path d="M180 156l50 8" />
      </g>
      <rect y="206" width="320" height="14" className="i-mid" opacity=".5" />
    </Scene>
  );
}

export function ScenePartners(props: SceneProps) {
  return (
    <Scene {...props}>
      <circle cx="160" cy="62" r="34" className="i-sun" />
      <path d="M66 206v-48a42 42 0 0 1 84 0v48z" className="i-sky" />
      <circle cx="108" cy="100" r="19" className="i-skin" />
      <path d="M89 98a19 19 0 0 1 38 0z" className="i-lilac" />
      <path d="M170 206v-42a42 42 0 0 1 84 0v42z" className="i-clay" />
      <circle cx="212" cy="108" r="19" className="i-skin" />
      <path d="M193 106a19 19 0 0 1 38 0z" className="i-sun" />
      <rect x="134" y="168" width="52" height="34" rx="17" className="i-light" />
      <circle cx="176" cy="176" r="12" className="i-skin" />
      <path d="M164 176a12 12 0 0 1 24 0z" className="i-rose" />
      <path d={star(50, 66, 9)} className="i-light g-twinkle" />
      <path d={star(274, 80, 11)} className="i-light g-twinkle" style={{ animationDelay: ".9s" }} />
      <rect y="206" width="320" height="14" className="i-mid" opacity=".5" />
    </Scene>
  );
}

export function SceneNotebook(props: SceneProps) {
  return (
    <Scene {...props}>
      <Sprig x={46} h={66} />
      <circle cx="268" cy="60" r="26" className="i-sun" />
      <g transform="rotate(-6 150 128)">
        <rect x="92" y="44" width="124" height="150" rx="10" className="i-light" />
        <rect x="92" y="44" width="16" height="150" rx="8" className="i-clay" />
        <g className="i-bg">
          <circle cx="100" cy="66" r="3" />
          <circle cx="100" cy="92" r="3" />
          <circle cx="100" cy="118" r="3" />
          <circle cx="100" cy="144" r="3" />
          <circle cx="100" cy="170" r="3" />
        </g>
        <g strokeWidth="3.5" strokeLinecap="round" className="s-mid" opacity=".55">
          <path d="M126 76h66" />
          <path d="M126 96h66" />
          <path d="M126 116h44" />
        </g>
        <path d="M159 168V148" stroke="var(--g-ill-clay)" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="151" cy="150" rx="5" ry="10" transform="rotate(-40 151 150)" className="i-sun" />
        <ellipse cx="167" cy="148" rx="5" ry="10" transform="rotate(40 167 148)" className="i-rose" />
      </g>
      <g transform="rotate(34 238 130)">
        <rect x="230" y="68" width="14" height="92" rx="3" className="i-sun" />
        <rect x="230" y="68" width="14" height="14" rx="3" className="i-clay" />
        <path d="M230 160h14l-7 20z" className="i-skin" />
      </g>
      <rect y="206" width="320" height="14" className="i-mid" opacity=".5" />
    </Scene>
  );
}
