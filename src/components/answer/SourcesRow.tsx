import { Cover } from "@/components/ui";
import { findSourceByAuthor, getTopicById, isAllTopic, type Source, type Topic } from "@/lib/topics";

function SourceChip({ author, src }: { author: string; src?: Source }) {
  return (
    <div className="flex items-center gap-[11px] bg-g-panel rounded-[16px] py-[9px] pl-[9px] pr-[15px] shadow-[var(--g-shadow-sm)] max-w-full">
      <Cover spine={src?.spine || "var(--g-ill-mid)"} title={src?.title || author} w={34} h={46} />
      <div className="min-w-0">
        <div className="font-body text-[13px] font-semibold text-g-ink leading-[1.25]">{author}</div>
        {src && (
          <div className="font-display italic text-[13.5px] text-g-sub leading-[1.2] mt-[1px] max-w-[190px] truncate">
            {src.title}
          </div>
        )}
      </div>
    </div>
  );
}

/** Topics the answer drew on, in first-cited order, for an "all" answer. */
export function topicsFromSources(sources: string[]): Topic[] {
  const seen: Topic[] = [];
  for (const author of sources) {
    const hit = findSourceByAuthor(author);
    if (hit && !seen.includes(hit.topic)) seen.push(hit.topic);
  }
  return seen;
}

/** Source attribution: small illustrated book covers with author + title. */
export function SourcesRow({ sources, topicId }: { sources: string[]; topicId: string }) {
  if (sources.length === 0) return null;

  if (isAllTopic(topicId)) {
    const groups = topicsFromSources(sources).map((topic) => ({
      topic,
      authors: sources.filter((a) => findSourceByAuthor(a)?.topic === topic),
    }));
    return (
      <div className="mt-6">
        <div className="font-body text-[11.5px] font-bold tracking-[1px] uppercase text-g-faint mb-[10px]">
          From the books
        </div>
        <div className="flex flex-col gap-[14px]">
          {groups.map(({ topic, authors }) => (
            <div key={topic.id}>
              <div className="flex items-center gap-[7px] mb-[8px] font-body text-[12.5px] font-semibold text-g-sub">
                <span className="w-[10px] h-[10px] rounded-full" style={{ background: `var(--g-t-${topic.hue})` }} />
                {topic.name}
              </div>
              <div className="flex flex-wrap gap-[10px]">
                {authors.map((a) => (
                  <SourceChip key={a} author={a} src={topic.sources.find((s) => s.author === a)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const topic = getTopicById(topicId);
  return (
    <div className="mt-6">
      <div className="font-body text-[11.5px] font-bold tracking-[1px] uppercase text-g-faint mb-[10px]">
        From the books
      </div>
      <div className="flex flex-wrap gap-[10px]">
        {sources.map((author, j) => (
          <SourceChip key={j} author={author} src={topic?.sources.find((s) => s.author === author)} />
        ))}
      </div>
    </div>
  );
}
