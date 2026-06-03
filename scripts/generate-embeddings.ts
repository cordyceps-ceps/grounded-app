/**
 * One-time script to generate embeddings for all document_chunks.
 *
 * Usage:
 *   npx tsx scripts/generate-embeddings.ts
 *
 * Required env vars (from .env.local):
 *   OPENAI_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 20; // OpenAI supports up to 2048 inputs per call
const MODEL = "text-embedding-3-small"; // 1536 dimensions, $0.02/1M tokens

async function main() {
  // Get all chunks without embeddings
  const { data: chunks, error } = await supabase
    .from("document_chunks")
    .select("id, content")
    .is("embedding", null)
    .order("id");

  if (error) {
    console.error("Failed to fetch chunks:", error);
    process.exit(1);
  }

  console.log(`Found ${chunks.length} chunks to embed`);

  if (chunks.length === 0) {
    console.log("All chunks already have embeddings!");
    return;
  }

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.content);

    try {
      const response = await openai.embeddings.create({
        model: MODEL,
        input: texts,
      });

      // Update each chunk with its embedding
      for (let j = 0; j < batch.length; j++) {
        const embedding = response.data[j].embedding;
        const { error: updateError } = await supabase
          .from("document_chunks")
          .update({ embedding: JSON.stringify(embedding) })
          .eq("id", batch[j].id);

        if (updateError) {
          console.error(`Failed to update chunk ${batch[j].id}:`, updateError);
          failed++;
        } else {
          processed++;
        }
      }

      console.log(
        `Processed ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`
      );
    } catch (err) {
      console.error(`Batch starting at ${i} failed:`, err);
      failed += batch.length;
    }
  }

  console.log(`\nDone! Processed: ${processed}, Failed: ${failed}`);

  // Verify
  const { count } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .not("embedding", "is", null);

  console.log(`Total chunks with embeddings: ${count}`);
}

main().catch(console.error);
