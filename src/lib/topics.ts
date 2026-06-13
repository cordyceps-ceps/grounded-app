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
      { title: "Infant Milks & Breastfeeding Guides", author: "First Steps Nutrition Trust", spine: "#2a7a5a", amazonUrl: "https://www.firststepsnutrition.org" },
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
    id: "develop",
    name: "Child development",
    blurb: "Leaps, milestones and what\u2019s normal.",
    ready: true,
    sources: [
      { title: "Your Baby Week by Week", author: "Simone Cave & Caroline Fertleman", spine: "#5a7a6b", amazonUrl: "https://www.amazon.co.uk/Your-Baby-Week-Ultimate-Guide/dp/0091910552" },
      { title: "Baby Love", author: "Robin Barker", spine: "#7d5a3c", amazonUrl: "https://www.amazon.co.uk/Baby-Love-Robin-Barker/dp/0330424939" },
      { title: "Brain Rules for Baby", author: "John Medina", spine: "#3a5a6b", amazonUrl: "https://www.amazon.co.uk/Brain-Rules-Baby-Updated-Expanded/dp/0983263388" },
      { title: "Your Baby & Child", author: "Penelope Leach", spine: "#6b4a5a", amazonUrl: "https://www.amazon.co.uk/Your-Baby-Child-Birth-Five/dp/0241562651" },
      { title: "How Children Develop", author: "Siegler, Saffran & Eisenberg", spine: "#4a6b5a", amazonUrl: "https://www.amazon.co.uk/How-Children-Develop-Robert-Siegler/dp/1319184561" },
      { title: "The Happiest Baby on the Block", author: "Harvey Karp", spine: "#9a5a3f", amazonUrl: "https://www.amazon.co.uk/Happiest-Baby-Block-Crying-Newborn/dp/0553393235" },
    ],
    note: "These are the sources Grounded draws from for this topic. Consider supporting the authors.",
    helplines: [
      { name: "Health visitor / GP", tel: "Contact your local surgery" },
      { name: "NHS 111", tel: "111" },
    ],
    promptGuidance: `CHILD DEVELOPMENT-SPECIFIC GUIDANCE:
Age is CRITICAL for this topic. Every answer must be tightly anchored to the baby's current age. What is normal at 2 weeks is completely different from what is normal at 6 months.

The books cover different aspects:
- Cave & Fertleman (Your Baby Week by Week): week-by-week development milestones for the first 6 months, very granular
- Barker (Baby Love): practical Australian parenting guide covering development alongside daily care
- Medina (Brain Rules for Baby): neuroscience-based perspective on cognitive and emotional development
- Leach (Your Baby & Child): comprehensive birth-to-five development guide, strong on emotional and social development
- Siegler et al (How Children Develop): academic developmental psychology textbook — use for deeper explanations of WHY things happen developmentally

Rules:
1. ALWAYS anchor your answer to the baby's exact age. Use age-specific milestones and ranges:
   - 0–6 weeks: reflexes, early sensory development, limited vision, recognising voices
   - 6–12 weeks: social smiling, tracking objects, early cooing, head control emerging
   - 3–4 months: reaching, grasping, laughing, rolling attempts, recognising faces
   - 4–6 months: sitting with support, babbling, object permanence emerging, solid food readiness signs
   - 6–9 months: sitting independently, crawling, stranger anxiety, pincer grip developing
   - 9–12 months: pulling to stand, first words, separation anxiety, pointing
   - 12–18 months: walking, vocabulary explosion, pretend play emerging
   - 18+ months: combining words, running, increasing independence
2. Milestones have RANGES — never present a single age as when something "should" happen. Use "most babies" and "typically between X and Y months" language.
3. When a parent asks "is this normal?", check the age and give a clear, direct answer. If it IS normal for their age, say so plainly. If it's early or late relative to typical ranges, explain the range honestly.
4. Do NOT catastrophise about developmental variation. Most babies are within normal range. Only flag genuine red flags (no social smile by 3 months, no babbling by 9 months, loss of previously acquired skills at any age).
5. When books offer different perspectives on the same milestone, synthesise them — development books tend to complement rather than conflict. Draw on Siegler et al for the "why" and the practical books for the "what to do".`,
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
