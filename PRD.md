# Grounded — Product Requirements Document

**Status:** Final Draft
**Date:** 2026-06-01
**Author:** Nick

---

## 1. Vision

Grounded is a calm, trustworthy companion that answers questions from curated, expert-vetted books — not the open internet. Each topic is its own bounded knowledge space. Users get specific, grounded answers from sources they trust.

The core differentiator: **deliberately limited knowledge**. No hallucinated dosages, no contradictory forum advice, no anxiety-inducing rabbit holes. Just the books, clearly cited.

The name says it: grounded in real sources, grounded for anxious people.

### Two-layer product

**Layer 1 — Parenting guide (the beachhead):** A curated set of topics and books for expecting and new parents. Nick builds and manages the knowledge base. This is where Grounded launches — it demonstrates the concept, teaches users what vetted knowledge feels like, and builds trust in the model.

**Layer 2 — Personal knowledge platform (the long-term vision):** Users take control. They customise existing topics, swap out books they don't want, add sources they trust, and eventually create entirely new topics for whatever they care about. Grounded becomes a general-purpose tool for building your own vetted knowledge space — parenting is just the first room in the house.

The phased approach is intentional: start curated so users understand what the product is and why it works. Unlock customisation once the model is understood.

---

## 2. Problem

New parents face a firehose of conflicting advice. Googling parenting questions returns SEO content, Reddit threads, and outdated forum posts. Even general AI chatbots draw from the whole internet and can confabulate medical information. The result: parents either over-trust bad sources or distrust everything.

What they actually need is a knowledgeable friend who has the right books open beside them.

---

## 3. Audience

**Initial launch:** Nick and Tess's antenatal group — a small trusted circle of expecting and new parents. Nick shares a signup link directly.

**Usage context:** Mobile, one-handed, tired, often anxious. Low tolerance for friction. High need for reassurance alongside information. Many users will not be familiar with AI tools — the experience must feel intuitive without any AI literacy.

---

## 4. Core Concept: The Vetted Knowledge Model

Each **topic** is a self-contained module with:

- A curated set of **2–5 source books** (PDFs provided by Nick)
- Optional **video sources** — curated YouTube channels whose content is indexed and can be referenced in answers
- A **topic-specific system prompt** defining the guide's persona and safety limits
- A knowledge base indexed for retrieval (books + video transcripts)
- **Clear attribution** on answers ("According to Huggins, Ch. 4…")
- **Amazon links** to each source book so parents can buy them, with a note encouraging support for the authors

Topics are **not** connected to each other's knowledge bases. A breastfeeding question stays in breastfeeding sources. This keeps answers precise and avoids bleed between topics.

---

## 5. MVP Topic: Breastfeeding Guide

### Source books
- *The Nursing Mother's Companion* — Huggins
- *The Womanly Art of Breastfeeding* — La Leche League
- *Breastfeeding Made Simple* — Mohrbacher

### Video sources
- La Leche League Canada — youtube.com/@LaLecheLeagueCanada_Official (practical guidance: latching, positioning, feeding cues, newborn nursing)

### System prompt
Already written and tested in Nick's Claude project. Import as-is. The tone is: warm, encouraging, concise. Lead with the answer. Use numbered steps for physical actions. Normalise common experiences. Deflect to professionals for anything clinical.

---

## 6. User Flows

### 6.1 Onboarding

1. **Welcome screen** — explains what Grounded is and how it works (vetted books, not the internet)
2. **Account creation** — Google SSO or email + password. Must come before profile setup so data is saved immediately
3. **Baby profile setup** — asks for baby's basic details (name, date of birth or due date, birth weight). Explains *why* this information helps: "Grounded uses these details to give you age-appropriate, relevant answers"
4. **First topic walkthrough** — opens the breastfeeding topic, explains the interface, shows where sources are listed, and explains best practice: **start a new conversation for each new question** rather than continuing old threads (keeps answers focused and reduces cost)

### 6.2 Signing up as a partner

When signing up, the user is asked: **"Are you setting up for the first time, or joining a partner?"**

- **First time:** Creates new family account + baby profile
- **Joining a partner:** Explains how to receive an invite from their partner (email or shareable link). Joining links the accounts so all conversations, baby profiles, and topic facts are shared under one family

### 6.3 Home screen

The home screen shows:

- **Recent conversations** — across all topics, most recent first. Each shows topic badge, auto-generated title, who started it, and timestamp
- **Topic cards** — each topic as a card with name, short description, and number of source books. Tap to enter the topic

### 6.4 Topic page

When entering a topic:

1. **Stale facts banner** (if any) — shown at the top. Facts older than 2 weeks are flagged as potentially stale. Each shows the fact text with quick-action buttons to **edit**, **delete**, or **pin** (pinned facts never go stale). The banner is friendly and brief: "Some facts about [baby name] might be out of date — worth a quick check?"
2. **Baby context summary** — a compact card showing the baby's relevant details and topic-specific facts. This context is automatically injected into every query so the AI gives personalised answers
3. **Sources** — books listed with covers/titles and Amazon links, plus any video channels with a link to the channel. A note: "These are the sources Grounded draws from for this topic. Consider supporting the authors."
4. **Conversations in this topic** — list of past conversations with auto-generated titles and who started them
5. **Start new conversation** button — prominent, primary action
6. **Suggested questions** *(Phase 2)* — prompts like "Is cluster feeding normal at this age?" surfaced based on baby's age and topic, to help users discover what to ask

### 6.5 Conversation

- **Chat interface** — clean, message bubbles, timestamps
- **Response streaming** — answers stream in word-by-word as the AI generates them (Claude API supports this natively). No blank screen while waiting. Text appears immediately, reducing anxiety and making the 3–8 second generation time feel instant. A gentle pulsing indicator shows while the response is still generating
- **Messages subtly attributed** — each message shows a small tag for who asked (e.g. "Nick" or "Tess"), not prominent but visible so partners can follow the thread
- **Rich text responses** — AI responses use full formatting:
  - **Bold** for key terms and actions
  - *Italics* for book references and emphasis
  - Numbered steps for anything physical (latching, positioning)
  - Bullet points for options or lists
  - Clear visual hierarchy — headings, spacing, scannable structure
  - The goal: responses feel like a well-edited article, not a wall of text
- **Source attribution** inline where possible ("Huggins recommends…")
- **Video links** — when a question involves something physical or visual (latching, positioning, holds), and a relevant video exists in the topic's indexed channels, Grounded surfaces it alongside the text answer as an embedded preview card with title, channel name, and duration. Video complements the book answer — it never replaces it. "Here's what the book says, and here's a video showing you"
- **Auto-generated title** — created from the first message, shown in conversation list
- **Conversation age nudge** — if a conversation is getting long or old, a gentle prompt suggests starting a fresh one: "This conversation is getting long — you'll get better answers by starting a new one"
- **Pin a message** *(Phase 2)* — long-press/tap-hold to pin an answer. Pinned messages include a brief summary of the question for context and appear in a pinned section within the topic
- **Copy message** — tap to copy any message to clipboard

### 6.6 Voice input

- Tap a microphone button in the chat input
- Record voice → transcribed via Whisper API
- **Transcript is pasted into the text input field** so the user can review and edit before sending
- Essential for one-handed, tired-parent use

### 6.7 Push notifications

- When a user sends a question and leaves the app, they receive a **push notification when the answer arrives**
- Only the user who asked the question gets the notification — not their partner
- No other push notifications (no stale fact alerts, no partner activity alerts)

---

## 7. Baby Profile & Topic Facts

### 7.1 Baby profile (global)

Basic details shared across all topics:

- Baby's name
- Date of birth (or due date if not yet born)
- Birth weight (if born)

These are set during onboarding and editable from a profile screen. Keep this minimal — anything topic-specific (e.g. feeding method) belongs in topic facts, not the global profile. One child supported initially; architecture should allow multiple children in future (with a child selector so context injection is specific to the selected child).

**Age display:** The baby's age is calculated and displayed in the way parents naturally think — "3 weeks, 4 days" or "4 months" — not as a raw date. This appears in the baby context summary on topic pages and is injected into the AI context as natural language ("Your baby is 3 weeks old"), which helps the AI give age-appropriate answers.

**Pre-natal state:** Some users will sign up before the baby is born (the initial audience is an antenatal group). The profile handles this gracefully:
- If only a due date is provided: display shows "Due [date]" or "[X weeks] until due date"
- Context injected to the AI as: "Baby not yet born, due [date]"
- All topics remain accessible — pre-natal questions are valid ("How do I prepare for breastfeeding?", "What do I need?")
- After birth, the user updates the profile with DOB and birth weight. The transition is simple — an in-app prompt or manual edit

### 7.2 Topic facts

Each topic has its own set of **facts** — short statements about the baby relevant to that topic. Examples:

- Breastfeeding: "Currently cluster feeding in evenings", "Tongue tie diagnosed week 1, snipped week 2"
- Sleep: "Won't settle after 7pm without rocking", "Sleeps in bedside crib"

**Key behaviours:**

- Facts are **manually added and removed** by the user for MVP. Grounded does not auto-extract facts from conversations (conversations often contain unresolved questions, making extracted information unreliable)
- **Future: AI-suggested facts** — after a conversation, Grounded may suggest a fact based on what was discussed (e.g. "It sounds like [baby] is cluster feeding in the evenings — save this as a fact?"). The user always confirms or edits before saving. This bridges manual effort and automation without compromising accuracy
- Facts are **viewable by topic** — easy to find and manage
- Facts **flag as stale after 2 weeks** — shown at the top of the topic page with quick edit/delete/pin actions
- **Pinned facts** never flag as stale (e.g. "Tongue tie snipped week 2" is permanently relevant)
- Facts are **injected into the system prompt** for every query in that topic, giving the AI personalised context
- The UI explains *why* facts exist in plain language: "These help Grounded give you more relevant answers. Add anything that's currently true for [baby name]."

---

## 8. Family Accounts

- Each family has **one shared space** — conversations, baby profile, and topic facts are all shared between linked accounts
- Partners **invite** each other via email or shareable link during signup
- Both partners see all conversations, tagged subtly by who started and who said what
- Each partner has their own login (Google SSO or email/password)
- Push notifications are personal — only the person who asked a question gets notified of the answer

---

## 9. Design & Aesthetics

### 9.1 Design feeling

Grounded should feel like **a knowledgeable friend's kitchen table** — warm, unhurried, a stack of well-read books nearby. Not a hospital. Not a startup. Not a baby app.

**Reference point:** Nara Baby's simplicity and task focus, but with a warmer, quieter, more editorial aesthetic.

### 9.2 What to avoid

- **Baby pastels** (pink, mint, powder blue) — infantilises the parents
- **Clinical white + blue** — signals medical anxiety
- **Tech-startup energy** (bold gradients, dark mode heroes, glassmorphism) — wrong trust register
- **Cartoon icons or mascots** — patronising
- **Walls of text** — every response should be formatted for scanning

### 9.3 Visual direction

- **Palette:** Warm cream background, deep forest green primary, warm stone/taupe secondary, gentle amber accent. Earthy, calm, grounded
- **Typography:** Serif for headings (bookish, trustworthy — e.g. Lora, Playfair). Clean sans-serif for body and UI (readable — e.g. Inter, DM Sans)
- **Layout:** Card-based where appropriate. Generous white space. Nothing competes for attention
- **Imagery:** Minimal. No stock photos. Book covers for source attribution. Clean icons where needed
- **Tone:** *Kinfolk* magazine meets a well-designed parenting book cover

### 9.4 Night mode

Essential — not optional. The core use case is reading at 3am in a dark room while feeding.

- **Auto mode** by default: follows the device's system light/dark setting
- **Manual toggle** available in settings or via a quick-access icon
- **Dark palette should stay warm** — dark charcoal or warm near-black background, muted cream text. Not pure black (#000) which feels cold. Forest green and amber accents shift to softer, lower-saturation variants
- Typography remains highly legible at low brightness
- Transition between modes is a smooth, gentle fade

### 9.5 Animation

Animations are present but **simple and purposeful**:

- Smooth page transitions and fades
- Gentle loading states (not spinners — soft pulsing or skeleton screens)
- Subtle feedback on tap/interaction
- No bouncing, no gamification, no badges, no confetti

### 9.6 Design principles

1. **One hand, one thumb** — every primary action reachable in the thumb zone
2. **Calm over clever** — simplicity is the feature
3. **Clarity is kindness** — large type, high contrast, short labels. Tired parents at 3am
4. **Show the source** — book attribution is a design element, not a footnote
5. **Quiet when empty** — no guilt about unused features; empty states are gentle
6. **Format for scanning** — bold key terms, numbered steps, bullet points. Every AI response reads like a well-edited article

### 9.7 Empty states

First impressions matter. When a user opens a topic or the home screen for the first time, they see no conversations and no facts. These moments should feel **inviting, not barren**:

- **Home (no conversations yet):** A warm welcome message and the topic cards. "Welcome to Grounded. Pick a topic to ask your first question."
- **Topic page (no conversations, no facts):** The source books are visible. A gentle prompt: "Ask your first question about breastfeeding" alongside an optional nudge: "Add a fact about [baby name] to get more personalised answers." Not instructional — just warm and clear
- **Topic page (no facts):** A brief explanation of what facts are and why they help, with a single "Add a fact" button. "Tell Grounded something about [baby name] — like how they're feeding right now — and your answers will be more relevant"

---

## 10. Safety & Trust

- Every topic has a visible **"Sources"** section listing its books — always accessible, never hidden
- Consistent **deflection language** for clinical questions: warm, not alarming. "This is one for your midwife or lactation consultant"
- **No external search**, no web browsing, no improvised answers. If the books don't cover it, Grounded says so plainly
- Visible **disclaimer**: "Grounded draws from expert books but is not a replacement for medical advice" — light-touch, not a legal wall
- The system prompt enforces all safety boundaries. Grounded never invents medications, dosages, or diagnoses

### Escalation resources

Each topic includes a curated list of **real helplines and professional resources** — accessible from the topic page and surfaced inline when the AI deflects to a professional.

**Breastfeeding (MVP):**
- National Breastfeeding Helpline — 0300 100 0212
- La Leche League GB — 0345 120 2918
- Association of Breastfeeding Mothers — 0300 330 5453
- Local IBCLC (International Board Certified Lactation Consultant) directory link

**Behaviour:** When the AI response includes a deflection ("this is one for your midwife"), the relevant resource is linked inline — not just mentioned abstractly. The topic page also has a permanent "Get help" section with the full list. Keep this simple: a short list of phone numbers and links, not a directory. These are for moments of genuine need, not browsing.

---

## 11. Technical Architecture

### Frontend
- **Next.js** (React) — SSR for fast first load, PWA support
- **Tailwind CSS** — mobile-first styling
- Deployed on **Vercel**
- Installable as **PWA** (Add to Home Screen)

### Backend
- **Anthropic Claude API** — claude-sonnet-4-6 for standard queries, streaming enabled for real-time response delivery
- Per-topic system prompts with baby profile + topic facts injected
- Knowledge: PDFs processed for RAG (embeddings + vector search) or Claude's built-in document handling
- **Conversation persistence:** PostgreSQL via Supabase
- **Auth:** Supabase Auth (Google SSO + email/password)
- **Voice transcription:** OpenAI Whisper API
- **Video indexing:** YouTube Data API v3 to fetch video lists from curated channels; transcripts via YouTube auto-captions (or Whisper for channels without captions). Titles, descriptions, and transcripts are indexed alongside book content. Periodic re-index picks up new videos
- **Push notifications:** Web Push API (service worker)

### Native app readiness

The MVP is a web app (PWA), but the architecture is designed so a native iOS/Android app can be added later without rewriting the backend.

**Key rule: all business logic lives in API routes, not React Server Components.** Every feature (chat, facts, auth, profile) is accessible via clean `/api/*` endpoints that return JSON. This means any client — web, React Native, or otherwise — can consume the same backend.

This is enforced by:
- **No data fetching in Server Components** that can't also be called from an API route. SSR is used for the web shell only, not as a data layer
- **Supabase Auth** works natively with both web and React Native clients (token-based, not cookie-dependent)
- **All external services** (Claude API, Whisper, Supabase) are API-first and client-agnostic

**When native makes sense** (likely after product validation with the antenatal group):
- **Recommended path:** React Native / Expo consuming the same API — shares React knowledge, one codebase for iOS + Android, Supabase has a native SDK
- **Lightweight alternative:** Capacitor wrapping the PWA — minimal effort but not truly native

### Data model

```
Family
  ├── BabyProfile
  │     ├── name, dob, birth_weight
  │     └── TopicFacts[]
  │           ├── topic_id
  │           ├── text
  │           ├── pinned (boolean)
  │           ├── created_at
  │           └── updated_at
  ├── Users[] (linked accounts)
  │     ├── email, auth_provider
  │     └── push_subscription
  └── Conversations[]
        ├── topic_id
        ├── title (auto-generated from first message)
        ├── started_by (user_id)
        ├── created_at
        └── Messages[]
              ├── user_id (who sent it)
              ├── role (user | assistant)
              ├── content (rich text / markdown)
              ├── sources[] (optional citations)
              ├── pinned (boolean, later)
              └── timestamp
```

### Topic configuration (managed by Nick)

Topics are manually created and managed. No admin UI needed for MVP. Each topic is defined by:

- Topic name and description
- Source book list (with Amazon URLs)
- Video source channels (YouTube URLs)
- Escalation resources (helplines, professional directories)
- System prompt
- PDF knowledge base files
- Suggested questions (later)

---

## 12. Roadmap

### Phase 1 — MVP

**Topic:** Breastfeeding

**Features:**
- Onboarding (welcome, baby profile, topic walkthrough)
- Auth (Google SSO + email/password)
- Family accounts with partner invite
- Baby profile with age display and pre-natal support
- Breastfeeding topic with source books, Amazon links, escalation resources
- Chat with rich text formatting and response streaming
- Topic facts (manual add/edit/delete, stale flagging, pinning)
- Voice input (Whisper → editable transcript)
- Conversation history (auto-titled, attributed, shared)
- Conversation age nudge
- Push notifications (answer ready)
- Night mode (auto + manual)
- PWA (installable, mobile-first)

### Phase 2 — Expand

**New topics:**

| Topic | Potential sources |
|---|---|
| Infant sleep | *Precious Little Sleep* (Ballard), *The No-Cry Sleep Solution* (Pantley) |
| Weaning & solids | *Baby-Led Weaning* (Rapley), *The Pediatrician's Guide to Feeding Babies* |
| Newborn care | *The Happiest Baby on the Block* (Karp), *Your Baby & Child* (Leach) |
| Child development | *The Wonder Weeks*, *What to Expect the First Year* |
| Postpartum wellbeing | Curated with extra care — strong deflection to professionals |

**New features:**
- Suggested questions — age-aware prompts surfaced on topic entry
- Pinned messages — save key answers with brief context summaries
- AI-suggested facts — prompted after conversations, user confirms before saving
- Conversation search — search across all history
- User-managed knowledge — families can upload their own books, hide curated ones they don't want, or replace them with preferred versions (detail below)

#### User-Managed Knowledge (detail)

Families gain control over the knowledge base for each topic. They can add their own books, remove curated ones they don't want, or replace them with their own preferred versions.

**Supported upload formats:** PDF (processed directly), EPUB, MOBI, AZW, and other common ebook formats — converted to PDF via **Calibre** (headless, open source) before processing.

**How it works:**
1. User enters a topic's knowledge settings
2. They see the curated books and their own uploads separately
3. They can **add** a new book (any format), **hide** a curated book they don't want to draw from, or **remove** their own uploads
4. Uploaded books are converted if needed, extracted, and added to the family's personal knowledge index for that topic

**Source management in the UI:**
- *Curated by Grounded* — Nick's vetted books. Shown by default. Users can hide individual ones if they prefer not to draw from them (e.g. they disagree with a book's approach, or have a newer edition)
- *Added by you* — user's personal uploads. Fully manageable. Can be removed at any time
- A family could, if they choose, hide all curated books and run entirely on their own sources — their call

**Source attribution in answers:** Every answer shows which source it drew from — curated or personal. "According to your copy of *Ina May's Guide*…" vs "According to Huggins…". Users always know the provenance.

**Storage:** Per-family file storage via Supabase Storage. Processed text embedded and indexed per-family, per-topic.

---

### Phase 3 — Self-Service Platform

The product opens up fully. Users can create their own topics from scratch — not just parenting. Any subject, any books they care about.

**User-created topics:**
1. User taps "Create a topic"
2. Names it, writes a short description
3. Uploads their knowledge base (any supported format)
4. Optionally customises the guide's persona and safety boundaries (guided, not raw prompt editing)
5. Topic is live for their family immediately

**What this unlocks:**
- A parent could build a "Pregnancy nutrition" topic with books their midwife recommended
- Someone could build a "Marathon training" topic, a "Home renovation" topic, a "Grief support" topic — anything where they want grounded answers from trusted sources, not the internet
- Grounded becomes a personal knowledge platform, not just a parenting app

**Generalised context model:** In Phase 3, the "baby profile" concept generalises to a **context profile** — a set of facts relevant to the topic's subject. For a marathon training topic, the context profile might be current weekly mileage, race goal, and injury history. For a home renovation topic, it might be house age and budget. The architecture is the same; only the label and content changes.

**Guardrails:**
- User-created topics are private to the family (not shared or discoverable by others)
- Safety guidelines still apply — the system prompt template includes baseline deflection language that users can add to but not remove entirely
- No topics that could cause direct harm (a flag/review mechanism may be needed if the product ever opens beyond trusted circles)

**Additional Phase 3 features:**
- Multiple children — child selector, per-child context injection
- Proactive nudges — "Your baby is 4 months — the sleep guide is now relevant"
- Conversation sharing/export

---

## 13. Non-Goals (MVP)

- Native iOS/Android apps (PWA for MVP; architecture is native-ready for later — see section 11)
- Admin UI for topic management
- Community features or user-generated content
- Automatic fact extraction from conversations
- Multilingual support
- Monetisation
- Integration with NHS or external health systems

---

## 14. Success Metrics

- Parents return to ask follow-up questions (repeat usage over first month)
- Conversations are short and focused (sign the "start new" guidance works)
- Topic facts are actively maintained (sign parents understand the value)
- Qualitative: users report feeling **reassured, not anxious** after using Grounded
- Zero incidents of harmful medical advice

---

## 15. Development Workflow

### Deployment & visibility

The app should be **live and viewable on a URL at all times** — not just running locally. Every meaningful change is deployed and visible.

- **Hosting:** Vercel, connected to the GitHub repo. Every push to `main` triggers an automatic production deployment
- **Preview deployments:** Vercel generates a unique preview URL for every PR/branch push, so work-in-progress can be reviewed before merging
- **Live URL from day one:** The first commit (even a skeleton) gets deployed so there's always something to see

### Git workflow

- **Regular commits** — small, frequent, descriptive. Commit after each meaningful piece of work, not in large batches
- **Push to GitHub** consistently — the remote repo should always reflect the current state of the project
- **Branch per feature** when appropriate, with PRs for anything non-trivial
- **Main branch is always deployable** — never merge broken code into main

---

## 16. Next Steps

- [ ] Create GitHub repo and connect to Vercel (live URL from first commit)
- [ ] Set up Next.js + Supabase project scaffold — deploy skeleton
- [ ] Spike: Claude API with breastfeeding PDFs (replicate the Claude project behaviour via API)
- [ ] Design: mobile UI wireframes (home, topic page, chat)
- [ ] Build: auth flow (Google SSO + email/password)
- [ ] Build: baby profile onboarding
- [ ] Build: conversation persistence + history
- [ ] Build: voice input (Whisper integration)
- [ ] Build: family account linking
- [ ] Beta test with Tess
- [ ] Share with antenatal group
