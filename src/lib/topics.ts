export interface Source {
  title: string;
  author: string;
  spine: string;
  amazonUrl?: string;
}

export interface VideoSource {
  channel: string;
  handle: string;
  url?: string;
}

export interface Topic {
  id: string;
  name: string;
  blurb: string;
  ready: boolean;
  sources: Source[];
  video?: VideoSource;
  note?: string;
  care?: boolean;
}

export const TOPICS: Topic[] = [
  {
    id: "bf",
    name: "Breastfeeding",
    blurb: "Latching, supply and feeding rhythms.",
    ready: true,
    sources: [
      { title: "The Nursing Mother\u2019s Companion", author: "Kathleen Huggins", spine: "#3f5e4a" },
      { title: "The Womanly Art of Breastfeeding", author: "La Leche League", spine: "#7d5a3c" },
      { title: "Breastfeeding Made Simple", author: "Nancy Mohrbacher", spine: "#9a6b3f" },
    ],
    video: { channel: "La Leche League Canada", handle: "@LaLecheLeagueCanada" },
    note: "These are the sources Grounded draws from for this topic. Consider supporting the authors.",
  },
  {
    id: "sleep",
    name: "Infant sleep",
    blurb: "Naps, night wakings and gentle settling.",
    ready: false,
    sources: [
      { title: "Precious Little Sleep", author: "Alexis Dubief", spine: "#46586b" },
      { title: "The No-Cry Sleep Solution", author: "Elizabeth Pantley", spine: "#6b4a5a" },
    ],
  },
  {
    id: "weaning",
    name: "Weaning & solids",
    blurb: "Starting solids and baby-led weaning.",
    ready: false,
    sources: [
      { title: "Baby-Led Weaning", author: "Gill Rapley", spine: "#6b6a3a" },
      { title: "The Pediatrician\u2019s Guide to Feeding Babies", author: "Anthony Porto", spine: "#9a6b3f" },
    ],
  },
  {
    id: "newborn",
    name: "Newborn care",
    blurb: "Soothing and the early weeks.",
    ready: false,
    sources: [
      { title: "The Happiest Baby on the Block", author: "Harvey Karp", spine: "#9a5a3f" },
      { title: "Your Baby & Child", author: "Penelope Leach", spine: "#3f5e4a" },
    ],
  },
  {
    id: "develop",
    name: "Child development",
    blurb: "Leaps, milestones and what\u2019s normal.",
    ready: false,
    sources: [
      { title: "The Wonder Weeks", author: "Hetty van de Rijt", spine: "#3a5a55" },
      { title: "What to Expect the First Year", author: "Heidi Murkoff", spine: "#7d5a3c" },
    ],
  },
  {
    id: "postpartum",
    name: "Postpartum wellbeing",
    blurb: "Your recovery and your own wellbeing.",
    ready: false,
    care: true,
    sources: [
      { title: "The Fourth Trimester", author: "Kimberly Ann Johnson", spine: "#6b4a4a" },
    ],
  },
];

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
