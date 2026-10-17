import { Play, Phone } from "lucide-react";
import { Kicker } from "@/components/ui";
import { mdInline, type AnswerBlock } from "@/lib/parseAnswer";

export function AnswerBlockRenderer({ block }: { block: AnswerBlock }) {
  if (block.type === "h") {
    return (
      <div className="g-up font-display text-[26px] text-g-ink mt-[26px] mb-[2px] leading-[1.05]">
        <span
          aria-hidden="true"
          className="block w-[22px] h-[3px] rounded-full bg-g-clay mb-[10px]"
        />
        {block.text}
      </div>
    );
  }

  if (block.type === "lead") {
    return (
      <p
        className="g-up font-body text-[16px] leading-[1.62] text-g-ink"
        dangerouslySetInnerHTML={{ __html: mdInline(block.md || "") }}
      />
    );
  }

  if (block.type === "p") {
    return (
      <p
        className="g-up font-body text-[15px] leading-[1.62] text-g-sub mt-[12px]"
        dangerouslySetInnerHTML={{ __html: mdInline(block.md || "") }}
      />
    );
  }

  if (block.type === "ol" && block.items) {
    return (
      <ol className="g-up list-none m-0 mt-[16px] p-0 flex flex-col">
        {block.items.map((item, j) => (
          <li
            key={j}
            className="flex gap-[14px] py-[13px] border-t border-g-line first:border-t-0 first:pt-0"
          >
            <span className="font-display text-[30px] text-g-clay leading-[0.85] shrink-0 w-[24px]">
              {j + 1}
            </span>
            <span
              className="font-body text-[15px] leading-[1.55] text-g-ink pt-[1px]"
              dangerouslySetInnerHTML={{ __html: mdInline(item) }}
            />
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "ul" && block.items) {
    return (
      <ul className="g-up list-none m-0 mt-[14px] p-0 flex flex-col gap-[10px]">
        {block.items.map((item, j) => (
          <li key={j} className="flex gap-[12px]">
            <span className="shrink-0 mt-[8px] w-[6px] h-[6px] rounded-full bg-g-clay" />
            <span
              className="font-body text-[15px] leading-[1.55] text-g-ink"
              dangerouslySetInnerHTML={{ __html: mdInline(item) }}
            />
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "video") {
    const ytUrl = block.videoId ? `https://www.youtube.com/watch?v=${block.videoId}` : "#";
    return (
      <a
        href={ytUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="g-up mt-5 rounded-[22px] overflow-hidden bg-g-panel shadow-[var(--g-shadow-sm)] block no-underline g-tap"
      >
        <div className="h-[140px] flex items-center justify-center relative bg-g-panel2">
          {block.thumbnailUrl ? (
            <img
              src={block.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          <span className="w-[52px] h-[52px] rounded-full bg-g-prim text-g-on-prim flex items-center justify-center shadow-[0_5px_14px_rgba(0,0,0,0.25)] relative z-10">
            <Play size={22} />
          </span>
        </div>
        <div className="p-4">
          <Kicker color="var(--g-clay)" className="mb-[6px]">
            Here&rsquo;s a video that may help
          </Kicker>
          <div className="font-display text-[21px] text-g-ink leading-[1.05]">{block.title}</div>
          <div className="font-body text-[12.5px] text-g-faint mt-[5px]">
            {block.channel}
            {block.dur ? ` · ${block.dur}` : ""}
          </div>
        </div>
      </a>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="g-up mt-6 bg-g-clay-soft rounded-[22px] p-[18px]">
        <div className="font-body text-[14.5px] leading-[1.55] text-g-ink mb-[14px]">
          {block.text}
        </div>
        {block.resource && (
          <a
            className="flex items-center gap-[12px] no-underline bg-g-panel rounded-[16px] p-[10px] pr-[14px] shadow-[var(--g-shadow-sm)]"
            href={`tel:${block.resource.tel}`}
          >
            <span className="w-[42px] h-[42px] rounded-full bg-g-clay text-g-bg flex items-center justify-center shrink-0">
              <Phone size={18} />
            </span>
            <span>
              <span className="block font-body text-[14px] font-bold text-g-ink">
                {block.resource.name}
              </span>
              <span className="block font-display text-[19px] text-g-clay leading-[1.1]">
                {block.resource.tel}
              </span>
            </span>
          </a>
        )}
      </div>
    );
  }

  return null;
}

export function AnswerBlocks({
  blocks,
  caret,
}: {
  blocks: AnswerBlock[];
  caret?: boolean;
}) {
  return (
    <div className="font-body text-[15px] leading-[1.6] text-g-ink">
      {blocks.map((block, j) => (
        <AnswerBlockRenderer key={j} block={block} />
      ))}
      {caret && <span className="g-caret" style={{ background: "var(--g-prim)" }} />}
    </div>
  );
}
