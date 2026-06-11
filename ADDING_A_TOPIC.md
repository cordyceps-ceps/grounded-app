# Adding a New Topic to Grounded

Everything is driven from `src/lib/topics.ts`. The system is designed so that once the config and content are in place, all UI, prompts, suggestions, source badges, and helplines work automatically.

## Steps

### 1. Add topic config in `src/lib/topics.ts`

Add a new entry to the `TOPICS` array. Required fields:

```ts
{
  id: "weaning",              // URL-safe slug, used everywhere
  name: "Weaning & solids",   // Display name
  blurb: "Starting solids.",  // One-liner for home page card
  ready: false,               // Set false until books are ingested
  sources: [                  // Books on the shelf
    {
      title: "Baby-Led Weaning",
      author: "Gill Rapley",
      spine: "#6b6a3a",       // Colour for the book spine UI
      amazonUrl: "https://...",
    },
  ],
}
```

Optional fields:
- `helplines` — array of `{ name, tel }` for UK support numbers
- `videos` — array of `{ channel, handle, channelId?, playlistId?, url? }`
- `promptGuidance` — extra system prompt instructions (e.g. for conflicting philosophies)
- `care` — boolean, shows "extra care" language in the UI
- `note` — custom note shown under the book list

### 2. Add books to ingestion script

In `scripts/ingest-books.mjs`, add a new key to `BOOKS_BY_TOPIC`:

```js
weaning: [
  { file: 'baby-led-weaning.pdf', title: 'Baby-Led Weaning', author: 'Gill Rapley' },
],
```

### 3. Copy PDFs to `books/` folder

```bash
cp ~/path/to/books/*.pdf books/
```

Filenames should be kebab-case to match the `file` field in step 2.

### 4. Ingest the books

```bash
node scripts/ingest-books.mjs --topic weaning
```

This extracts text, chunks it into ~500-word segments, and stores in `document_chunks` with `topic_id = "weaning"`.

### 5. Generate embeddings

```bash
npx tsx scripts/generate-embeddings.ts
```

This processes all chunks missing embeddings. If there are >1000 chunks, run it twice (Supabase returns max 1000 rows per query).

### 6. Set `ready: true`

In `src/lib/topics.ts`, flip the topic to `ready: true`. This:
- Shows the "Ask something new" CTA
- Shows conversation list instead of "Being curated" message
- Enables the fact-adding UI

### 7. Deploy

```bash
npx vercel --prod
```

## What's automatic (no code changes needed)

Once the topic is in `topics.ts` and content is ingested:

- **Home page** — topic card appears automatically from `TOPICS` array
- **Topic page** — books, helplines, videos, conversations, facts all render from config
- **Chat** — system prompt, RAG search, reranking all use topic name and books from config
- **Suggestions API** — generates topic-specific suggestions using topic name
- **Follow-ups API** — generates topic-aware follow-up questions
- **Source badges** — `extractSources()` matches author last names from the topic's sources
- **Fallback suggestions** — uses `DEFAULT_FALLBACK` if no topic-specific ones are cached

## Optional: add fallback suggestions

In `src/app/(app)/chat/[id]/page.tsx`, add to `FALLBACK_SUGGESTIONS`:

```ts
weaning: [
  "When should I start offering solids?",
  "What are good first foods for baby-led weaning?",
  "How do I know if she's ready for solids?",
],
```

These show before the AI generates personalised suggestions. Not strictly required — the app falls back to generic questions.

## Optional: add prompt guidance

If the topic's books have conflicting philosophies or need special handling, add `promptGuidance` to the topic config. See the sleep topic for an example. This gets injected into the system prompt.

## Checklist

- [ ] Topic added to `src/lib/topics.ts` with `ready: false`
- [ ] Books added to `BOOKS_BY_TOPIC` in `scripts/ingest-books.mjs`
- [ ] PDFs copied to `books/`
- [ ] `node scripts/ingest-books.mjs --topic <id>` run
- [ ] `npx tsx scripts/generate-embeddings.ts` run (twice if >1000 chunks)
- [ ] `ready: true` set in topics.ts
- [ ] Deployed with `npx vercel --prod`
- [ ] Tested: topic page loads, new chat works, sources show correctly
