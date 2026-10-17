# Grounded redesign: "Editorial + Illustrated"

Branch: `redesign/editorial-illustrated` (nothing pushed or deployed until Nick says so).

## 1. What the research found

**The app today.** Next 15, Tailwind v4, tokens as OKLCH CSS vars in `globals.css`, Instrument Serif + Figtree, Lucide icons, "Kitchen Table" palette (cream + terracotta + honey), warm night mode, ~4.7k lines of screen code across onboarding, home, topic, chat, timeline, settings and admin. Book "covers" are plain coloured rectangles. There are no illustrations anywhere.

**Why it reads as "Claudy".** Cream paper, terracotta accent and an italic serif accent word is the Claude look almost exactly. The fonts are fine (keep them). The palette and the absence of any visual personality are what to change.

**What Nara does (everydayindustries case study, store listings).** One colour plus one illustration per activity type, so tired parents orient at a glance. Layered cards. Calm, ad-free, no cartoon cuteness. Design system "purposefully simple". The lesson is system and restraint, not decoration.

**Correction to my v2 mock.** It invented a bottom tab bar (Ask / Shelf / Saved / Journal), a search-hero home, and books Grounded doesn't have. The real product is topic-first, with isolated per-topic knowledge spaces, one question per conversation, and a book-only timeline (PRD 9.6, CLAUDE.md). The mock was a visual direction only. This build keeps the real IA. No tab bar, no new features.

## 2. Brand

- **Personality:** the friend who has read everything and never makes you feel behind. Warm, plain, a little dry. Sophisticated first, gentle second.
- **Voice:** "Here's what the books say." Never "Yay, great question!".
- **Differentiator:** the books are the product. Source attribution is a design element (PRD 9.6), so covers become illustrated objects.

## 3. Design language

**Colour (OKLCH, light + night, all tokens).**
- Primary moves from terracotta to deep **moss**. Terracotta stays as a secondary accent (rules, numerals, key highlights).
- Paper background stays warm but slightly less yellow.
- Each topic owns a hue and a tint: Breastfeeding = rose, Sleep = sky, Development = lilac, Weaning = sun, Newborn = sage, Postpartum = clay. Added as `Topic.hue`.
- Pastels are fills only. Text on any tint uses ink and must pass WCAG AA (checked per tint, light and night).
- Night mode stays warm near-black, with moss-tinted greys and softer saturation.

**Type.** Keep Instrument Serif and Figtree. Fix the faux italic (only weight 400 normal is loaded) by loading the real italic. Serif for voice and headings of 18px or more, Figtree for everything read.

**Shape.** 20-28px radii, pills for buttons, soft tinted shadows, optional paper grain on the page background only.

**Motion.** Slow and soft, reduced-motion respected. A gently rocking moon or an open-book page-turn while the answer streams. Existing `g-up` entrances stay.

## 4. Illustration system

Custom SVG as React components in `src/components/illustrations/`. They use CSS variables, so they follow night mode. No image files, no network, `aria-hidden`.

**Rules.** Flat overlapping geometry. No outlines, gradients or faces. Figures are abstract, so any parent sees themselves. Max five colours per scene, drawn from the palette. A shared 200x200 grid and consistent corner and circle logic.

**Set.**
1. Topic spots: one per topic (moon, bowl, sprig/blocks, plus the three upcoming).
2. Brand mark: sprig, replacing the Lucide `Leaf` tile in `TopBar` and onboarding.
3. Hero scenes: welcome, plus 3-4 onboarding walkthrough scenes.
4. Empty states: no conversations, no facts, topic "being curated", timeline empty.
5. `BookCover`: generative, deterministic from title and spine colour, one of six motifs. Replaces `Cover`, so source attribution looks designed without using copyrighted cover art.
6. Loading and streaming: rocking moon, open book.
7. Timeline: week-by-week growth motif (sprig stages).

## 5. Components and screens

**Primitives (`components/ui`).** Tokens, `Card`, `TopicTile`, `BookCover` (replaces `Cover`), restyled `Button`, `Segmented`, `Sheet`, `Kicker`, `Field`, `TopBar`.

**Screens.**
- Onboarding (welcome, account, choose, profile, facts, walkthrough, join): scene illustration per step.
- Home: greeting with a small scene, illustrated topic tiles (ready tiles in colour, "Soon" tiles muted), restyled timeline card, designed empty state.
- Topic: coloured header band, `BookCover` sources, calmer facts list.
- Chat: coloured topic header, answer blocks (heading, numbered steps, callout, pull-quote with terracotta rule), sources as cover chips, helpline callout, streaming indicator.
- Timeline and milestone, Settings, Admin (token-inherited, light touch).
- PWA: `theme-color`, manifest colours, new icon from the sprig mark.

## 6. Out of scope (hard line)

API routes, prompts, `parseAnswer`/`extractSources` logic, Supabase schema, auth, data flow, the information architecture. Visual layer only. Chat logic changes only where markup has to move.

## 7. Build order

0. Branch. Commit the pre-existing uncommitted fix in `chat/[id]/page.tsx` as its own commit (not mine, it must not get tangled with design work).
1. Tokens, fonts (real italic), `Topic.hue`.
2. Illustration library plus a dev-only styleguide route (`/dev/styleguide`, 404 in production) to review every asset in light and night.
3. Primitives.
4. Screens in parallel groups: (a) onboarding and invite, (b) home, topic, timeline, (c) chat, settings, admin.
5. PWA assets.
6. Remove nothing the app needs; delete the styleguide route's production exposure.

## 8. Verification

- `npm run typecheck`, `npm run lint`, `npm test`, `next build` must all pass at the end of each phase.
- Headless-Chrome screenshots at 390px, light and night, for every screen reachable without Supabase auth, plus the styleguide fixtures for authed screens.
- Contrast check script for every text-on-tint pairing, both themes.
- Manual pass by Nick on a Vercel preview before merge. Authed screens (home, topic, chat) can't be fully driven without a live Supabase session, so that pass is the real acceptance test.

## 9. Risks

- Chat page is 895 lines and holds streaming logic; markup changes there are the most likely place to regress behaviour. Mitigation: change classNames and extract presentational pieces only, keep handlers untouched, run the chat route tests.
- Tailwind v4 token mapping: new tokens must go in both `:root`, `.night` and `@theme inline`.
- Illustration quality is the whole game. Budget for iteration on the set before building screens around it.
- Nothing ships to production from this branch without an explicit go.
