export interface Source {
  title: string;
  author: string;
  spine: string;
  amazonUrl?: string;
}

export interface VideoSource {
  channel: string;
  handle: string;
  channelId?: string;
  playlistId?: string;
  url?: string;
}

export interface Helpline {
  name: string;
  tel: string;
}

export interface Topic {
  id: string;
  name: string;
  blurb: string;
  ready: boolean;
  sources: Source[];
  videos?: VideoSource[];
  note?: string;
  care?: boolean;
  helplines?: Helpline[];
  promptGuidance?: string;
}

export const TOPICS: Topic[] = [
  {
    id: "bf",
    name: "Breastfeeding",
    blurb: "Latching, supply and feeding rhythms.",
    ready: true,
    sources: [
      { title: "The Nursing Mother\u2019s Companion", author: "Kathleen Huggins", spine: "#3f5e4a", amazonUrl: "https://www.amazon.co.uk/Nursing-Mothers-Companion-Illustrations-Breastfeeding/dp/1558328823" },
      { title: "The Womanly Art of Breastfeeding", author: "La Leche League", spine: "#7d5a3c", amazonUrl: "https://www.amazon.co.uk/Womanly-Art-Breastfeeding-Completely-International/dp/0345518446" },
      { title: "Breastfeeding Made Simple", author: "Nancy Mohrbacher", spine: "#9a6b3f", amazonUrl: "https://www.amazon.co.uk/Breastfeeding-Made-Simple-Natural-Nursing/dp/1572248610" },
    ],
    videos: [
      { channel: "Global Health Media Project", handle: "@GlobalHealthMediaProject", playlistId: "PLxVdpaMfvxLCDSNEgM2QcN5pAc-LraJgL", url: "https://www.youtube.com/playlist?list=PLxVdpaMfvxLCDSNEgM2QcN5pAc-LraJgL" },
    ],
    note: "These are the sources Grounded draws from for this topic. Consider supporting the authors.",
    helplines: [
      { name: "National Breastfeeding Helpline", tel: "0300 100 0212" },
      { name: "La Leche League GB", tel: "0345 120 2918" },
      { name: "Association of Breastfeeding Mothers", tel: "0300 330 5453" },
    ],
  },
  {
    id: "sleep",
    name: "Sleep",
    blurb: "Naps, night wakings and gentle settling.",
    ready: true,
    sources: [
      { title: "Healthy Sleep Habits, Happy Child", author: "Marc Weissbluth", spine: "#46586b", amazonUrl: "https://www.amazon.co.uk/Healthy-Sleep-Habits-Happy-Child/dp/0553394800" },
      { title: "Precious Little Sleep", author: "Alexis Dubief", spine: "#5a6b4a", amazonUrl: "https://www.amazon.co.uk/Precious-Little-Sleep-Complete-Parents/dp/0997580828" },
      { title: "Solve Your Child's Sleep Problems", author: "Richard Ferber", spine: "#4a5a6b", amazonUrl: "https://www.amazon.co.uk/Solve-Your-Childs-Sleep-Problems/dp/0743201639" },
      { title: "The Happiest Baby on the Block", author: "Harvey Karp", spine: "#9a5a3f", amazonUrl: "https://www.amazon.co.uk/Happiest-Baby-Block-Crying-Newborn/dp/0553393235" },
    ],
    note: "These are the sources Grounded draws from for this topic. Consider supporting the authors.",
    helplines: [
      { name: "Lullaby Trust (safe sleep & SIDS)", tel: "0808 802 6869" },
      { name: "Cry-sis (crying & sleepless babies)", tel: "08451 228 669" },
      { name: "NHS 111", tel: "111" },
    ],
    promptGuidance: `SLEEP-SPECIFIC GUIDANCE:
These books represent distinct sleep philosophies. You MUST keep them separate — never blend contradictory approaches in the same answer.

The approaches:
- Weissbluth: emphasises biological sleep rhythms, early bedtimes, and extinction ("cry it out") for older babies
- Ferber: graduated extinction — progressive waiting with check-ins at increasing intervals
- Dubief (Precious Little Sleep): moderate approach — SWAP method, gentle fading, practical middle ground
- Karp (Happiest Baby): focuses on newborn soothing (5 S's), not sleep training per se

Rules:
1. ALWAYS tailor to the baby's age. What works at 2 weeks is wrong at 6 months:
   - 0–3 months: soothing, safe sleep basics, realistic expectations. Sleep training is NOT appropriate.
   - 3–4 months: sleep regression context, start building habits, no formal training yet
   - 4–6 months: sleep associations, gentle shaping becomes an option
   - 6–12 months: structured approaches (Ferber, Weissbluth) become appropriate if parents choose
   - 12+ months: nap transitions, toddler resistance, schedule adjustments
2. When multiple books offer different strategies for the same problem, present them as DISTINCT OPTIONS: "One approach (from Dubief) is… A different approach (from Ferber) is…" — let the parent choose.
3. If a parent asks about a specific method (e.g. "How does Ferber work?"), explain that approach clearly from its source without immediately countering with alternatives.
4. Flag when something is NOT age-appropriate: "This approach is generally recommended from around 4–6 months."
5. For safe sleep questions (back sleeping, room sharing, overheating), give clear, consistent guidance — the books agree on safety fundamentals.`,
  },
  {
    id: "weaning",
    name: "Weaning & solids",
    blurb: "Starting solids and baby-led weaning.",
    ready: false,
    sources: [
      { title: "Baby-Led Weaning", author: "Gill Rapley", spine: "#6b6a3a", amazonUrl: "https://www.amazon.co.uk/Baby-Led-Weaning-Completely-Expanded-Anniversary/dp/1665217510" },
      { title: "The Pediatrician\u2019s Guide to Feeding Babies", author: "Anthony Porto", spine: "#9a6b3f", amazonUrl: "https://www.amazon.co.uk/Pediatricians-Guide-Feeding-Babies-Toddlers/dp/1607749017" },
    ],
  },
  {
    id: "newborn",
    name: "Newborn care",
    blurb: "Soothing and the early weeks.",
    ready: false,
    sources: [
      { title: "The Happiest Baby on the Block", author: "Harvey Karp", spine: "#9a5a3f", amazonUrl: "https://www.amazon.co.uk/Happiest-Baby-Block-Crying-Newborn/dp/0553393235" },
      { title: "Your Baby & Child", author: "Penelope Leach", spine: "#3f5e4a", amazonUrl: "https://www.amazon.co.uk/Your-Baby-Child-Birth-Five/dp/0241562651" },
    ],
  },
  {
    id: "develop",
    name: "Child development",
    blurb: "Leaps, milestones and what\u2019s normal.",
    ready: false,
    sources: [
      { title: "The Wonder Weeks", author: "Hetty van de Rijt", spine: "#3a5a55", amazonUrl: "https://www.amazon.co.uk/Wonder-Weeks-Stress-Free-Babys-Behavior/dp/168268427X" },
      { title: "What to Expect the First Year", author: "Heidi Murkoff", spine: "#7d5a3c", amazonUrl: "https://www.amazon.co.uk/What-Expect-1st-Year-Pa/dp/1471175502" },
    ],
  },
  {
    id: "postpartum",
    name: "Postpartum wellbeing",
    blurb: "Your recovery and your own wellbeing.",
    ready: false,
    care: true,
    sources: [
      { title: "The Fourth Trimester", author: "Kimberly Ann Johnson", spine: "#6b4a4a", amazonUrl: "https://www.amazon.co.uk/Fourth-Trimester-Postpartum-Balancing-Restoring/dp/1611804000" },
    ],
    helplines: [
      { name: "PANDAS Foundation (Pre/Postnatal Depression)", tel: "0808 196 1776" },
      { name: "Samaritans", tel: "116 123" },
    ],
  },
];

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
