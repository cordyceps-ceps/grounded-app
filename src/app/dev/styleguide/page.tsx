import { notFound } from "next/navigation";
import { TOPICS } from "@/lib/topics";
import { Cover } from "@/components/ui";
import {
  BrandMark,
  MoonLoader,
  SceneBaby,
  SceneBooks,
  SceneNotebook,
  ScenePartners,
  SceneQuestion,
  SceneTogether,
  SpotConversations,
  SpotCurating,
  SpotFacts,
  SpotTimeline,
  TopicArt,
} from "@/components/illustrations";

const SWATCHES = ["bg", "panel", "panel2", "prim", "prim-soft", "clay", "honey", "line"];
const SCENES = [
  ["Together", SceneTogether],
  ["Books", SceneBooks],
  ["Baby", SceneBaby],
  ["Question", SceneQuestion],
  ["Partners", ScenePartners],
  ["Notebook", SceneNotebook],
] as const;
const SPOTS = [
  ["Conversations", SpotConversations],
  ["Facts", SpotFacts],
  ["Curating", SpotCurating],
  ["Timeline", SpotTimeline],
] as const;

function Panel({ night }: { night?: boolean }) {
  return (
    <div
      className={night ? "night" : ""}
      style={{ background: "var(--g-bg)", color: "var(--g-ink)", padding: 28, width: 680 }}
    >
      <div className="flex items-center gap-3 mb-5">
        <BrandMark size={34} />
        <span className="font-display text-[30px]">Grounded</span>
        <span className="font-display italic text-[30px] text-g-prim">{night ? "night" : "light"}</span>
        <span className="ml-auto"><MoonLoader size={44} /></span>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {SWATCHES.map((s) => (
          <div
            key={s}
            className="rounded-[12px] text-[10px] font-bold p-2 flex items-end"
            style={{ width: 70, height: 54, background: `var(--g-${s})`, border: "1px solid var(--g-line)", color: "var(--g-ink)" }}
          >
            {s}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {TOPICS.map((t) => (
          <div
            key={t.id}
            className="rounded-[22px] overflow-hidden relative"
            style={{ height: 124, background: `var(--g-t-${t.hue})` }}
          >
            <span className="absolute left-3 top-3 font-body text-[13px] font-semibold">{t.name}</span>
            <TopicArt topicId={t.id} className="absolute -right-3 -bottom-3" width={104} height={104} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {SCENES.map(([name, S]) => (
          <div key={name} className="rounded-[20px] overflow-hidden" style={{ aspectRatio: "320/220" }}>
            <S width="100%" height="100%" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {SPOTS.map(([name, S]) => (
          <div key={name} className="rounded-[18px] p-2" style={{ background: "var(--g-panel2)" }}>
            <S width="100%" />
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        {TOPICS.flatMap((t) => t.sources.slice(0, 2)).slice(0, 8).map((s, i) => (
          <Cover key={i} spine={s.spine} title={i % 2 ? s.title : undefined} w={i % 2 ? 84 : 44} h={i % 2 ? 118 : 60} />
        ))}
      </div>
    </div>
  );
}

export default function Styleguide() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="flex">
      <Panel />
      <Panel night />
    </div>
  );
}
