/**
 * Ingest books into Supabase for RAG.
 * Extracts text from PDFs, chunks into ~500-word segments, stores with metadata.
 *
 * Usage:
 *   node scripts/ingest-books.mjs --topic bf      # ingest breastfeeding books
 *   node scripts/ingest-books.mjs --topic sleep    # ingest sleep books
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse-new');
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BOOKS_BY_TOPIC = {
  bf: [
    {
      file: 'the-womanly-art-of-breastfeeding.pdf',
      title: 'The Womanly Art of Breastfeeding',
      author: 'La Leche League International',
    },
    {
      file: 'the-nursing-mothers-companion.pdf',
      title: "The Nursing Mother's Companion",
      author: 'Kathleen Huggins',
    },
    {
      file: 'breastfeeding-made-simple.pdf',
      title: 'Breastfeeding Made Simple',
      author: 'Nancy Mohrbacher',
    },
    {
      file: 'infant-milks-a-simple-guide.pdf',
      title: 'Infant Milks: A Simple Guide',
      author: 'First Steps Nutrition Trust',
    },
    {
      file: 'breastmilk-and-breastfeeding.pdf',
      title: 'Breastmilk and Breastfeeding',
      author: 'First Steps Nutrition Trust',
    },
  ],
  sleep: [
    {
      file: 'healthy-sleep-habits-happy-child.pdf',
      title: 'Healthy Sleep Habits, Happy Child',
      author: 'Marc Weissbluth',
    },
    {
      file: 'precious-little-sleep.pdf',
      title: 'Precious Little Sleep',
      author: 'Alexis Dubief',
    },
    {
      file: 'solve-your-childs-sleep-problems.pdf',
      title: "Solve Your Child's Sleep Problems",
      author: 'Richard Ferber',
    },
    {
      file: 'the-happiest-baby-on-the-block.pdf',
      title: 'The Happiest Baby on the Block',
      author: 'Harvey Karp',
    },
  ],
  develop: [
    {
      file: 'your-baby-week-by-week.pdf',
      title: 'Your Baby Week by Week',
      author: 'Simone Cave & Caroline Fertleman',
    },
    {
      file: 'baby-love.pdf',
      title: 'Baby Love',
      author: 'Robin Barker',
    },
    {
      file: 'brain-rules-for-baby.pdf',
      title: 'Brain Rules for Baby',
      author: 'John Medina',
    },
    {
      file: 'your-baby-and-child.pdf',
      title: 'Your Baby & Child',
      author: 'Penelope Leach',
    },
    {
      file: 'how-children-develop.pdf',
      title: 'How Children Develop',
      author: 'Siegler, Saffran & Eisenberg',
    },
    {
      file: 'the-happiest-baby-on-the-block.pdf',
      title: 'The Happiest Baby on the Block',
      author: 'Harvey Karp',
    },
  ],
};

// Parse --topic arg
const topicIdx = process.argv.indexOf('--topic');
const TOPIC_ID = topicIdx !== -1 ? process.argv[topicIdx + 1] : 'bf';
const BOOKS = BOOKS_BY_TOPIC[TOPIC_ID];

if (!BOOKS) {
  console.error(`Unknown topic: ${TOPIC_ID}. Available: ${Object.keys(BOOKS_BY_TOPIC).join(', ')}`);
  process.exit(1);
}

const CHUNK_SIZE = 500; // words per chunk
const CHUNK_OVERLAP = 50; // overlap words between chunks

/** Strip characters that PostgreSQL rejects (null bytes, surrogates, invalid XML range) */
function cleanText(text) {
  return text
    .replace(/\0/g, '')
    .replace(/[\uFFFD]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '');
}

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  // Clean up the text
  const cleaned = cleanText(text)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/);
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 50) {
      chunks.push(chunk);
    }
    i += chunkSize - overlap;
  }

  return chunks;
}

async function ingestBook(book) {
  const filePath = path.join(process.cwd(), 'books', book.file);
  console.log(`\nProcessing: ${book.title}...`);

  const dataBuffer = fs.readFileSync(filePath);
  const pdf = await pdfParse(dataBuffer);

  console.log(`  Pages: ${pdf.numpages}`);
  console.log(`  Text length: ${pdf.text.length} chars`);

  const chunks = chunkText(pdf.text);
  console.log(`  Chunks: ${chunks.length}`);

  // Insert in batches of 50
  const rows = chunks.map((content, index) => ({
    book_title: book.title,
    book_author: book.author,
    content,
    chunk_index: index,
    topic_id: TOPIC_ID,
  }));

  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('document_chunks').insert(batch);
    if (error) {
      console.error(`  Error inserting batch at ${i}:`, error.message);
      return;
    }
    inserted += batch.length;
    process.stdout.write(`  Inserted: ${inserted}/${rows.length}\r`);
  }

  console.log(`  Done: ${inserted} chunks inserted`);
}

async function main() {
  console.log(`Grounded — Book Ingestion [topic: ${TOPIC_ID}]`);
  console.log('========================\n');

  // Clear existing data for this topic only
  console.log(`Clearing existing ${TOPIC_ID} chunks...`);
  const { error: deleteError } = await supabase
    .from('document_chunks')
    .delete()
    .eq('topic_id', TOPIC_ID);

  if (deleteError) {
    console.error('Error clearing table:', deleteError.message);
    console.error('Have you created the table? Run the SQL from setup-db.sql first.');
    process.exit(1);
  }

  for (const book of BOOKS) {
    await ingestBook(book);
  }

  // Verify
  const { count } = await supabase
    .from('document_chunks')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal chunks in database: ${count}`);
  console.log('Ingestion complete!');
}

main().catch(console.error);
