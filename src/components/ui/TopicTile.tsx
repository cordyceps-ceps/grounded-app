import Link from "next/link";
import { TopicArt } from "@/components/illustrations";
import type { Topic } from "@/lib/topics";

interface TopicTileProps {
  topic: Topic;
  className?: string;
}

export function TopicTile({ topic, className = "" }: TopicTileProps) {
  const books = topic.sources.length;
  return (
    <Link
      href={`/topic/${topic.id}`}
      prefetch
      className={`g-up g-tap relative block overflow-hidden no-underline rounded-[26px] text-g-ink ${className}`}
      style={{
        background: `var(--g-t-${topic.hue})`,
        minHeight: 168,
        opacity: topic.ready ? 1 : 0.72,
      }}
    >
      <span className="absolute left-4 right-4 top-[15px] block font-display text-[23px] leading-[1.04]">
        {topic.name}
      </span>
      <span className="absolute left-4 bottom-[14px] block font-body text-[11.5px] font-semibold tracking-[0.2px] opacity-70">
        {topic.ready ? `${books} ${books === 1 ? "book" : "books"}` : "Being curated"}
      </span>
      <TopicArt
        topicId={topic.id}
        width={116}
        height={116}
        className="absolute -right-3 -bottom-3"
      />
    </Link>
  );
}
