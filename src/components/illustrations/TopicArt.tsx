import type { SVGProps } from "react";

type ArtProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

const star = (x: number, y: number, r: number) =>
  `M${x} ${y - r}l${r * 0.3} ${r * 0.7} ${r * 0.7} ${r * 0.3}-${r * 0.7} ${r * 0.3}-${r * 0.3} ${r * 0.7}-${r * 0.3}-${r * 0.7}-${r * 0.7}-${r * 0.3} ${r * 0.7}-${r * 0.3}z`;

export function SleepArt(props: ArtProps) {
  return (
    <Svg {...props}>
      <circle cx="100" cy="106" r="76" className="i-deep" />
      <circle cx="84" cy="94" r="36" className="i-sun" />
      <circle cx="104" cy="82" r="33" className="i-deep" />
      <path d={star(146, 66, 14)} className="i-light g-twinkle" />
      <path d={star(58, 142, 8)} className="i-light g-twinkle" style={{ animationDelay: "1.1s" }} />
      <g className="i-light">
        <circle cx="70" cy="174" r="22" />
        <circle cx="102" cy="164" r="28" />
        <circle cx="136" cy="176" r="19" />
        <rect x="58" y="174" width="90" height="26" rx="12" />
      </g>
    </Svg>
  );
}

export function FeedingArt(props: ArtProps) {
  return (
    <Svg {...props}>
      <circle cx="148" cy="58" r="30" className="i-sun" />
      <path d="M26 200V134a52 52 0 0 1 104 0v66z" className="i-deep" />
      <circle cx="78" cy="72" r="20" className="i-skin" />
      <path d="M57 74a21 21 0 0 1 42 0c-6-10-16-13-21-10-5-3-15 0-21 10z" className="i-deep" />
      <ellipse cx="118" cy="150" rx="44" ry="24" transform="rotate(-14 118 150)" className="i-light" />
      <circle cx="148" cy="138" r="13" className="i-skin" />
      <path d="M135 138a13 13 0 0 1 26 0z" className="i-lilac" />
    </Svg>
  );
}

export function DevelopArt(props: ArtProps) {
  return (
    <Svg {...props}>
      <circle cx="152" cy="58" r="26" className="i-clay" />
      <path d="M22 200V114a47 47 0 0 1 94 0v86z" className="i-deep" />
      <path d="M44 200v-80a25 25 0 0 1 50 0v80z" className="i-light" />
      <circle cx="69" cy="158" r="11" className="i-rose" />
      <rect x="120" y="142" width="58" height="58" rx="9" className="i-sun" />
      <rect x="132" y="102" width="34" height="42" rx="8" transform="rotate(-8 149 123)" className="i-clay" />
    </Svg>
  );
}

export function WeekArt(props: ArtProps) {
  return (
    <Svg {...props}>
      <circle cx="46" cy="48" r="22" className="i-sun" />
      <g strokeWidth="5" strokeLinecap="round" className="s-mid">
        <path d="M54 178v-30" />
        <path d="M100 178v-70" />
        <path d="M148 178V68" />
      </g>
      <g className="i-sun">
        <ellipse cx="45" cy="150" rx="6" ry="13" transform="rotate(-42 45 150)" />
        <ellipse cx="63" cy="146" rx="6" ry="13" transform="rotate(42 63 146)" />
      </g>
      <g className="i-clay">
        <ellipse cx="86" cy="118" rx="7" ry="17" transform="rotate(-44 86 118)" />
        <ellipse cx="114" cy="114" rx="7" ry="17" transform="rotate(44 114 114)" />
        <ellipse cx="100" cy="98" rx="6" ry="14" />
      </g>
      <g className="i-light">
        <ellipse cx="128" cy="92" rx="8" ry="20" transform="rotate(-44 128 92)" />
        <ellipse cx="168" cy="86" rx="8" ry="20" transform="rotate(44 168 86)" />
        <ellipse cx="148" cy="56" rx="7" ry="17" />
      </g>
      <path d="M0 200v-26c46-16 100-16 200 0v26z" className="i-deep" />
    </Svg>
  );
}

export function WeaningArt(props: ArtProps) {
  return (
    <Svg {...props}>
      <circle cx="78" cy="86" r="21" className="i-deep" />
      <circle cx="118" cy="72" r="18" className="i-lilac" />
      <circle cx="148" cy="94" r="15" className="i-rose" />
      <path d="M26 116h148a74 74 0 0 1-148 0z" className="i-clay" />
      <rect x="22" y="108" width="156" height="13" rx="6.5" className="i-light" />
      <g transform="rotate(30 170 64)" className="i-light">
        <rect x="165" y="14" width="10" height="90" rx="5" />
        <ellipse cx="170" cy="24" rx="16" ry="21" />
      </g>
    </Svg>
  );
}

export function NewbornArt(props: ArtProps) {
  return (
    <Svg {...props}>
      <path d={star(156, 46, 16)} className="i-sun g-twinkle" />
      <path d={star(36, 62, 9)} className="i-light g-twinkle" style={{ animationDelay: "1.2s" }} />
      <g transform="rotate(-16 100 128)">
        <rect x="22" y="80" width="156" height="98" rx="49" className="i-light" />
        <circle cx="62" cy="129" r="35" className="i-skin" />
        <path d="M27 129a35 35 0 0 1 70 0z" className="i-lilac" />
        <g strokeWidth="7" strokeLinecap="round" className="s-sky" fill="none">
          <path d="M112 88v82" />
          <path d="M142 90v78" />
        </g>
      </g>
    </Svg>
  );
}

export function PostpartumArt(props: ArtProps) {
  return (
    <Svg {...props}>
      <circle cx="104" cy="112" r="46" className="i-clay" />
      <path d="M150 52h30a14 14 0 0 0 0-28 18 18 0 0 0-34 4 12 12 0 0 0 4 24z" className="i-light" />
      <ellipse cx="36" cy="226" rx="96" ry="62" className="i-mid" />
      <circle cx="124" cy="274" r="120" className="i-deep" />
      <g strokeWidth="4" strokeLinecap="round" className="s-light">
        <path d="M70 176v-34" />
      </g>
      <g className="i-light">
        <ellipse cx="60" cy="146" rx="5.5" ry="12" transform="rotate(-40 60 146)" />
        <ellipse cx="80" cy="142" rx="5.5" ry="12" transform="rotate(40 80 142)" />
        <ellipse cx="70" cy="128" rx="5" ry="11" />
      </g>
    </Svg>
  );
}

const BY_TOPIC: Record<string, (p: ArtProps) => React.ReactElement> = {
  bf: FeedingArt,
  sleep: SleepArt,
  develop: DevelopArt,
  wbw: WeekArt,
  weaning: WeaningArt,
  newborn: NewbornArt,
  postpartum: PostpartumArt,
};

export function TopicArt({ topicId, ...props }: ArtProps & { topicId: string }) {
  const Art = BY_TOPIC[topicId] ?? DevelopArt;
  return <Art {...props} />;
}
