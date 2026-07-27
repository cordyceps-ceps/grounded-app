// "Week by week" milestone timeline — content sourced from Your Baby Week by Week
// (Simone Cave & Caroline Fertleman), the same book already cited in the
// "Child development" topic. The book covers birth through week 24 (six months),
// so this timeline is scoped to that range — it does not extend into the
// second half of the first year.

import { Leaf, Moon, Heart, Move, Eye, type LucideIcon } from "lucide-react";

export type Category = "feeding" | "sleep" | "social" | "physical" | "senses";

export interface CategoryInfo {
  label: string;
  icon: LucideIcon;
  fg: string;
  soft: string;
}

export const MS_CATS: Record<Category, CategoryInfo> = {
  feeding: { label: "Feeding", icon: Leaf, fg: "var(--g-cat-feeding)", soft: "var(--g-cat-feeding-soft)" },
  sleep: { label: "Sleep", icon: Moon, fg: "var(--g-cat-sleep)", soft: "var(--g-cat-sleep-soft)" },
  social: { label: "Social", icon: Heart, fg: "var(--g-cat-social)", soft: "var(--g-cat-social-soft)" },
  physical: { label: "Physical", icon: Move, fg: "var(--g-cat-physical)", soft: "var(--g-cat-physical-soft)" },
  senses: { label: "Senses", icon: Eye, fg: "var(--g-cat-senses)", soft: "var(--g-cat-senses-soft)" },
};

export interface Milestone {
  id: string;
  cat: Category;
  title: string;
  range: string;
  notice: string[];
  excerpt: string;
}

export interface Period {
  id: string;
  label: string;
  sub: string;
  startDay: number;
  endDay: number;
  items: Milestone[];
}

export const WBW_BOOK = {
  title: "Your Baby Week by Week",
  author: "Simone Cave & Caroline Fertleman",
  spine: "#5a7a6b",
};

const m = (id: string, cat: Category, title: string, range: string, notice: string[], excerpt: string): Milestone => ({
  id,
  cat,
  title,
  range,
  notice,
  excerpt,
});

// Flexible granularity: one week per period, days 0–174 (weeks 0–24), matching
// the book’s own chapter structure. startDay/endDay are days-since-birth.
const week = (n: number, label: string, sub: string, items: Milestone[]): Period => ({
  id: `w${n}`,
  label,
  sub,
  startDay: n * 7,
  endDay: n * 7 + 6,
  items,
});

export const PERIODS: Period[] = [
  week(0, "Week 0", "Newborn", [
    m(
      "w0a",
      "senses",
      "Watching your face",
      "From birth",
      ["Clearest focus at about 30cm — roughly feeding distance", "Prefers faces and high-contrast patterns", "A black-and-white mobile is about the only toy that registers"],
      "Your baby can see up to a distance of 30 cm/12 in… a black-and-white mobile above the changing table or his cot is about the only ‘toy’ a newborn will notice."
    ),
    m(
      "w0b",
      "physical",
      "Newborn reflexes",
      "From birth",
      ["Grasps a finger pressed into the palm", "Turns towards a stroked cheek, rooting for a feed", "These are automatic, not learned"],
      "If you touch your baby’s palm, he’ll grasp your finger… Stroke your baby’s cheek and he’ll turn towards your finger thinking it’s a breast."
    ),
  ]),
  week(1, "Week 1", "Getting to know you", [
    m(
      "w1a",
      "social",
      "Starting to recognise your face",
      "Weeks 1–2",
      ["Your face starts to stand out from others", "Studies show parents’ faces trigger calm and pleasure in babies", "Face-to-face time now is never wasted"],
      "Your baby will start to recognise your face. Studies show that parents’ faces trigger feelings of pleasure and calm in babies…"
    ),
    m(
      "w1b",
      "physical",
      "Practising the grasp reflex",
      "Weeks 1–4",
      ["Curls fingers tightly around anything pressed into the palm", "A strong, automatic reflex, not deliberate holding", "Fades over the coming weeks as it matures into a real grip"],
      "Continue to touch his palm to trigger his grasp response…"
    ),
  ]),
  week(2, "Week 2", "Finding a rhythm", [
    m(
      "w2a",
      "physical",
      "Uncurling from the newborn position",
      "Weeks 2–3",
      ["Looks suddenly taller as the foetal curl relaxes", "Limbs stretch out more when awake", "White noise can be soothing at this stage"],
      "Your baby will suddenly look taller as he begins to uncurl from his foetal position… He may be soothed by ‘white noise’…"
    ),
  ]),
  week(3, "Week 3", "Reaching out", [
    m(
      "w3a",
      "physical",
      "First reaches",
      "Weeks 3–5",
      ["Waves his arms rather than reaching with intent yet", "Most likely to notice high-contrast black-and-white toys", "Coordination is still catching up with curiosity"],
      "Your baby already knows how to wave his arms… He’s most likely to notice high-contrast black-and-white toys."
    ),
    m(
      "w3b",
      "feeding",
      "Growth spurt (around 3 weeks)",
      "Around week 3",
      ["Suddenly wants to feed much more often", "Usually settles again within a couple of days", "Not a sign your milk supply is failing"],
      "A lot of babies go through a growth spurt at around this time, as they’re nearly three weeks old… continue following your baby’s demands."
    ),
  ]),
  week(4, "Week 4", "One month in", [
    m(
      "w4a",
      "physical",
      "Real tears, and busier kicking",
      "Week 4",
      ["Starts crying actual tears for the first time", "Kicks more vigorously than in the first weeks", "Movements generally look stronger and less floppy"],
      "This week your baby will start crying his first actual tears… Your baby will be kicking more vigorously this week…"
    ),
    m(
      "w4b",
      "social",
      "Early ‘conversations’",
      "Weeks 4–6",
      ["Makes clear vowel sounds like ‘eeh’ and ‘aah’", "Responds to a slow, exaggerated back-and-forth", "The start of turn-taking that underlies language"],
      "You can try having a ‘conversation’ with your baby as he’s now able to make clear vowel sounds such as ‘eeh’ and ‘aah’…"
    ),
  ]),
  week(5, "Week 5", "Following with the eyes", [
    m(
      "w5a",
      "senses",
      "Tracking moving objects",
      "Weeks 5–7",
      ["Follows an object moved side to side overhead", "Eye movements look smoother, less jerky", "A sign vision and coordination are maturing together"],
      "If you move an object from side to side above your baby’s head, he’ll now be able to follow it with his eyes…"
    ),
  ]),
  week(6, "Week 6", "Smile week", [
    m(
      "w6a",
      "social",
      "The first real smile",
      "Weeks 5–7",
      ["A responsive smile aimed at your face or voice, not a windy one", "Nearly all babies smile by around seven weeks", "Worth mentioning if it hasn’t happened by then"],
      "Week six is smile week… nearly all babies should engage and smile to some extent before they’re seven weeks old."
    ),
    m(
      "w6b",
      "feeding",
      "A bigger growth spurt",
      "Around week 6",
      ["Another spurt, usually bigger than the three-week one", "Feeds more frequently for a few days", "Settles back down once supply catches up"],
      "Your baby is due for another growth spurt this week and it will probably be even bigger than the last one…"
    ),
  ]),
  week(7, "Week 7", "Noticing the wider world", [
    m(
      "w7a",
      "senses",
      "Finding patterns interesting",
      "Weeks 7–9",
      ["Still finds faces — especially yours — most interesting", "Drawn to symmetrical patterns", "Notices detail that would have gone unseen weeks ago"],
      "Your baby will still find faces (particularly yours) more interesting to look at than anything else… he loves symmetrical patterns as they appear to swim before his eyes."
    ),
  ]),
  week(8, "Week 8", "Talking back", [
    m(
      "w8a",
      "social",
      "Consonant sounds",
      "Weeks 8–10",
      ["Early sounds like ‘goo’, ‘gaa’, ‘coo’", "A step on from vowel-only cooing", "Responding to it keeps the exchange going"],
      "This week your baby may start to make consonant sounds, so listen out for him saying, ‘Goo, gaa, coo’…"
    ),
    m(
      "w8b",
      "sleep",
      "Learning to self-soothe",
      "From around 8 weeks",
      ["Around half of babies now manage a five-hour stretch", "Still wakes between sleep cycles like everyone does", "The skill is drifting back off alone, not staying asleep forever"],
      "Half of all babies will now sleep for five hours or more at night… Your job is to teach your baby to drift back off to sleep again, all by himself…"
    ),
  ]),
  week(9, "Week 9", "Getting a grip", [
    m(
      "w9a",
      "physical",
      "Lifting the head on tummy time",
      "Weeks 9–11",
      ["Less curled up on the tummy than before", "Lifts head for around 10 seconds or longer", "Short, supervised bursts build the strength"],
      "Your baby will be less curled up when you put him on his tummy and will be able to lift his head for about 10 seconds or longer…"
    ),
  ]),
  week(10, "Week 10", "Depth and colour", [
    m(
      "w10a",
      "senses",
      "Seeing in 3D",
      "From around 10 weeks",
      ["Brain starts meshing both eyes’ images into one", "Depth perception begins in earnest", "The world stops looking flat"],
      "Up until now, your baby hasn’t been able to see in three dimensions… now your baby’s brain is able to mesh the two images together…"
    ),
  ]),
  week(11, "Week 11", "Getting stronger", [
    m(
      "w11a",
      "physical",
      "Better aim, stronger neck",
      "Weeks 11–13",
      ["Keeps practising reaches for a baby gym or toys", "Neck muscles noticeably stronger", "Head control is catching up with the rest of the body"],
      "Your baby will continue to practise reaching for his baby gym or toys… By now your baby’s neck muscles are quite strong…"
    ),
  ]),
  week(12, "Week 12", "Three months", [
    m(
      "w12a",
      "social",
      "Rocking, and the first chuckle",
      "Weeks 12–14",
      ["May chuckle for the first time", "Gentle tickling often brings it out", "A precursor to the belly laughs still to come"],
      "Your baby may chuckle for the first time this week and you can encourage his giggles by gently tickling him…"
    ),
    m(
      "w12b",
      "feeding",
      "The three-month growth spurt",
      "Around 3 months",
      ["Most babies have a spurt around now", "Milk intake tends to plateau afterwards", "A natural settling point after months of frequent increases"],
      "Most babies have a growth spurt at around three months… After this growth spurt, milk intake tends to plateau…"
    ),
  ]),
  week(13, "Week 13", "Choosing favourites", [
    m(
      "w13a",
      "social",
      "Showing preferences",
      "From around 13 weeks",
      ["Old enough to like some people more than others", "Shows it through smiles", "Not a reflection on anyone left out — just early social wiring"],
      "Your baby is old enough to like some people more than others and shows his preference with his smiles…"
    ),
  ]),
  week(14, "Week 14", "Settling into evenings", [
    m(
      "w14a",
      "sleep",
      "Evenings start to settle",
      "From around 14 weeks",
      ["Becomes naturally more tired in the evenings", "Still too soon for sleeping through the night", "Most parents get a noticeably better night from here"],
      "You’ll find he’s becoming naturally more tired in the evenings from around this week… It’s still too soon for your baby to be sleeping through the night, but most parents will certainly be getting a much better night’s rest."
    ),
    m(
      "w14b",
      "physical",
      "Legs strong enough to stand",
      "Weeks 14–16",
      ["Legs support real weight when held upright", "Doesn’t mean standing alone is close", "A strength milestone, not a walking one"],
      "When you hold your baby in the ‘standing’ position, you’ll notice his legs are now strong enough to support his weight…"
    ),
  ]),
  week(15, "Week 15", "Rolling begins", [
    m(
      "w15a",
      "physical",
      "Rolling front to back",
      "Weeks 15–17",
      ["Some babies roll over for the first time now", "Rolling back to front usually takes another week or more", "Time to stop leaving him unattended on raised surfaces"],
      "Some babies will roll over for the first time around now… it will take him at least another week before he’s able to roll on to his back with ease."
    ),
    m(
      "w15b",
      "senses",
      "Not yet playing peekaboo",
      "Weeks 15–17",
      ["Peekaboo doesn’t land as a game yet", "Object permanence hasn’t developed", "Out of sight genuinely means out of mind for now"],
      "If you’ve ever tried playing peekaboo with your baby… he’s still too young to have developed what’s known as ‘object permanence’."
    ),
  ]),
  week(16, "Week 16", "Finding the hands", [
    m(
      "w16a",
      "physical",
      "Pushing up on the forearms",
      "Weeks 16–18",
      ["Pushes up to rest on forearms for a couple of minutes", "Builds arm and trunk strength", "Preparation for crawling further down the line"],
      "By now he’ll be able to push himself up and rest on his forearms for a couple of minutes… This strengthens his arm and trunk muscles in preparation for crawling at about seven months."
    ),
  ]),
  week(17, "Week 17", "Singing together", [
    m(
      "w17a",
      "social",
      "Enjoying songs and rhymes",
      "From around 17 weeks",
      ["Loves nursery rhymes sung to him", "Starts to recognise a song after around six repeats", "Familiarity is part of the enjoyment"],
      "From now on, your baby will love you singing nursery rhymes to him… Once you’ve repeated a song about six times your baby will start to recognise it."
    ),
  ]),
  week(18, "Week 18", "A more precise grip", [
    m(
      "w18a",
      "physical",
      "Using the thumb separately",
      "Weeks 18–20",
      ["Learns to use the thumb apart from the four fingers", "Picking things up gets noticeably more precise", "A stepping stone towards the pincer grip"],
      "Around now, you’ll notice your baby is better at picking things up because he’s learnt to use his thumb separately to his four fingers…"
    ),
  ]),
  week(19, "Week 19", "Everything to the mouth", [
    m(
      "w19a",
      "senses",
      "Mouthing everything",
      "From around 19 weeks",
      ["Puts everything he grabs straight into his mouth", "The mouth is more touch-sensitive than the fingers", "It’s exploration, not a bad habit"],
      "Your baby will start putting everything he grabs into his mouth around now… his mouth is more sensitive to touch than his fingers."
    ),
  ]),
  week(20, "Week 20", "Rolling both ways", [
    m(
      "w20a",
      "physical",
      "Rolling back to front",
      "Weeks 20–22",
      ["Rolls from back to front, completing both directions", "Still needs to sleep on his back for safety", "A reminder to keep the safe-sleep basics in place"],
      "From this week, your baby may roll from his back to his front… you should still put him to sleep on his back to reduce his risk of sudden infant death syndrome (SIDS)."
    ),
  ]),
  week(21, "Week 21", "Sitting up and reading", [
    m(
      "w21a",
      "physical",
      "Sitting up in the pram",
      "Weeks 21–23",
      ["Enough strength and head control to sit and take in the view", "May manage sitting alone for a few seconds", "Opens up a whole new way of seeing the world"],
      "He’s now old enough and has enough strength and head control to start sitting up and enjoying his surroundings… By now, he should be able to sit up by himself for a few seconds."
    ),
    m(
      "w21b",
      "feeding",
      "Weaning is coming into view",
      "Around 21 weeks",
      ["Worth thinking about a high chair soon", "Weaning itself is still a little way off", "A good moment to start planning rather than starting"],
      "You’ll be able to start weaning soon, so now is a good time to think about buying a high chair."
    ),
  ]),
  week(22, "Week 22", "On the move", [
    m(
      "w22a",
      "physical",
      "Rolling across the room",
      "Weeks 22–24",
      ["Rolling well enough to cross a room", "Worth clearing some floor space", "The first real mobility, however it looks"],
      "Lots of babies can roll competently enough to be able to move across a room, so clear some space as your baby begins to get on the move."
    ),
    m(
      "w22b",
      "senses",
      "A longer memory",
      "From around 22 weeks",
      ["Can remember a toy seen two days earlier", "Long-term memory is developing fast", "Familiar toys and routines start to matter more"],
      "His long-term memory is more developed and he can now remember a toy he saw two days ago…"
    ),
  ]),
  week(23, "Week 23", "Communicating without words", [
    m(
      "w23a",
      "social",
      "Clear (wordless) communication",
      "Weeks 23–24",
      ["Can’t talk yet, but communicates clearly", "Arches his back to signal wanting to be put down", "Worth learning his particular signals"],
      "Although your baby can’t talk, he’s now very good at communicating… arch his back when he wants to be put down."
    ),
    m(
      "w23b",
      "physical",
      "Sitting for longer",
      "Weeks 23–24",
      ["Sits unaided for around 10 seconds", "Still fairly wobbly at this stage", "Steadiness builds over the coming weeks"],
      "Your baby will be able to sit up by himself for about 10 seconds but he’ll probably be quite wobbly…"
    ),
  ]),
  week(24, "Week 24", "Six months", [
    m(
      "w24a",
      "physical",
      "Creeping, shuffling, or both",
      "Months 7–10",
      ["Most babies crawl properly from seven to ten months", "Around now, an early ‘creep’ may start to appear", "Not something to expect on schedule this week"],
      "Most babies start to crawl from between seven and ten months… he’ll start to ‘creep’ around now."
    ),
    m(
      "w24b",
      "social",
      "Playing peekaboo properly",
      "Around 6 months",
      ["Anticipates the ‘boo’ and giggles while waiting for it", "A sign object permanence has properly developed", "The game finally lands the way it’s meant to"],
      "If you play peekaboo with your baby he’s now able to anticipate you saying ‘boo’ and will giggle as he waits…"
    ),
  ]),
];

export function getCurrentPeriod(dob: string): Period {
  const ageDays = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays < 0) return PERIODS[0];
  const found = PERIODS.find((p) => ageDays >= p.startDay && ageDays <= p.endDay);
  return found || PERIODS[PERIODS.length - 1];
}

export function findMilestone(id: string): { milestone: Milestone; period: Period } | null {
  for (const period of PERIODS) {
    const milestone = period.items.find((it) => it.id === id);
    if (milestone) return { milestone, period };
  }
  return null;
}
