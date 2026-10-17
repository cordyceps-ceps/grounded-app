import { Cover } from "@/components/ui";
import { getTopicById } from "@/lib/topics";

/** Source attribution: small illustrated book covers with author + title. */
export function SourcesRow({ sources, topicId }: { sources: string[]; topicId: string }) {
  if (sources.length === 0) return null;
  const topic = getTopicById(topicId);
  return (
    <div className="mt-6">
      <div className="font-body text-[11.5px] font-bold tracking-[1px] uppercase text-g-faint mb-[10px]">
        From the books
      </div>
      <div className="flex flex-wrap gap-[10px]">
        {sources.map((author, j) => {
          const src = topic?.sources.find((s) => s.author === author);
          return (
            <div
              key={j}
              className="flex items-center gap-[11px] bg-g-panel rounded-[16px] py-[9px] pl-[9px] pr-[15px] shadow-[var(--g-shadow-sm)] max-w-full"
            >
              <Cover spine={src?.spine || "var(--g-ill-mid)"} title={src?.title || author} w={34} h={46} />
              <div className="min-w-0">
                <div className="font-body text-[13px] font-semibold text-g-ink leading-[1.25]">
                  {author}
                </div>
                {src && (
                  <div className="font-display italic text-[13.5px] text-g-sub leading-[1.2] mt-[1px] max-w-[190px] truncate">
                    {src.title}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
