#!/usr/bin/env node
/**
 * Ingest YouTube videos from configured channels and playlists.
 *
 * Usage:
 *   node scripts/ingest-videos.mjs              # full ingest (skip existing)
 *   node scripts/ingest-videos.mjs --update     # only fetch new videos
 *   node scripts/ingest-videos.mjs --prune      # remove videos from deleted sources
 *
 * Env vars:
 *   YOUTUBE_API_KEY           — YouTube Data API v3 key
 *   OPENAI_API_KEY            — for embeddings
 *   NEXT_PUBLIC_SUPABASE_URL  — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key
 */

import { createClient } from "@supabase/supabase-js";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!YOUTUBE_API_KEY || !OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars. Need: YOUTUBE_API_KEY, OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const args = process.argv.slice(2);
const UPDATE_ONLY = args.includes("--update");
const PRUNE = args.includes("--prune");

// ── Topic config (mirrors src/lib/topics.ts) ──────────────────────────
const VIDEO_SOURCES = [
  {
    topicId: "bf",
    sources: [
      { playlistId: "PLxVdpaMfvxLCDSNEgM2QcN5pAc-LraJgL", channel: "Global Health Media Project", handle: "@GlobalHealthMediaProject" },
    ],
  },
];

// ── YouTube API helpers ───────────────────────────────────────────────

async function ytFetch(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  url.searchParams.set("key", YOUTUBE_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

/** Get the "uploads" playlist ID for a channel */
async function getUploadsPlaylistId(channelId) {
  const data = await ytFetch("channels", {
    part: "contentDetails",
    id: channelId,
  });
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
}

/** Fetch all video IDs from a playlist */
async function getPlaylistVideoIds(playlistId) {
  const ids = [];
  let pageToken = "";
  while (true) {
    const params = {
      part: "snippet",
      playlistId,
      maxResults: 50,
    };
    if (pageToken) params.pageToken = pageToken;
    const data = await ytFetch("playlistItems", params);
    for (const item of data.items || []) {
      const vid = item.snippet?.resourceId?.videoId;
      if (vid) ids.push(vid);
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return ids;
}

/** Fetch video details (title, description, duration, thumbnail) in batches */
async function getVideoDetails(videoIds) {
  const results = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await ytFetch("videos", {
      part: "snippet,contentDetails",
      id: batch.join(","),
    });
    for (const item of data.items || []) {
      results.push({
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description || "",
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
        publishedAt: item.snippet.publishedAt,
        duration: parseDuration(item.contentDetails.duration),
      });
    }
  }
  return results;
}

/** Parse ISO 8601 duration (PT4M30S) to human-readable (4:30) */
function parseDuration(iso) {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Embeddings ────────────────────────────────────────────────────────

async function generateEmbeddings(texts) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI embeddings failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  // Get existing video IDs to skip
  const { data: existing } = await supabase
    .from("topic_videos")
    .select("video_id");
  const existingIds = new Set((existing || []).map((r) => r.video_id));

  console.log(`Found ${existingIds.size} existing videos in DB`);

  // Track all valid channel handles for pruning
  const validHandles = new Set();

  for (const topicConfig of VIDEO_SOURCES) {
    console.log(`\n── Topic: ${topicConfig.topicId} ──`);

    for (const source of topicConfig.sources) {
      validHandles.add(source.handle);
      let videoIds = [];

      if (source.playlistId) {
        console.log(`  Fetching playlist ${source.playlistId} (${source.channel})...`);
        videoIds = await getPlaylistVideoIds(source.playlistId);
      } else if (source.channelId) {
        console.log(`  Fetching channel ${source.channel} (${source.channelId})...`);
        const uploadsId = await getUploadsPlaylistId(source.channelId);
        if (!uploadsId) {
          console.warn(`  ⚠ Could not find uploads playlist for ${source.channelId}`);
          continue;
        }
        videoIds = await getPlaylistVideoIds(uploadsId);
      }

      // Filter out already-indexed videos
      const newIds = videoIds.filter((id) => !existingIds.has(id));
      console.log(`  Found ${videoIds.length} videos, ${newIds.length} new`);

      if (newIds.length === 0) continue;

      // Fetch details
      const videos = await getVideoDetails(newIds);
      console.log(`  Got details for ${videos.length} videos`);

      // Generate embeddings in batches of 50
      const EMBED_BATCH = 50;
      for (let i = 0; i < videos.length; i += EMBED_BATCH) {
        const batch = videos.slice(i, i + EMBED_BATCH);
        const texts = batch.map((v) =>
          `${v.title}\n${v.description.slice(0, 500)}`
        );

        console.log(`  Embedding batch ${Math.floor(i / EMBED_BATCH) + 1}/${Math.ceil(videos.length / EMBED_BATCH)}...`);
        const embeddings = await generateEmbeddings(texts);

        // Upsert to Supabase
        const rows = batch.map((v, j) => ({
          topic_id: topicConfig.topicId,
          channel_handle: source.handle,
          channel_name: source.channel,
          video_id: v.videoId,
          title: v.title,
          description: v.description.slice(0, 2000),
          thumbnail_url: v.thumbnailUrl,
          published_at: v.publishedAt,
          duration: v.duration,
          embedding: JSON.stringify(embeddings[j]),
        }));

        const { error } = await supabase
          .from("topic_videos")
          .upsert(rows, { onConflict: "video_id" });

        if (error) {
          console.error(`  ✗ Upsert error:`, error.message);
        } else {
          console.log(`  ✓ Upserted ${rows.length} videos`);
        }

        // Mark as existing so duplicate sources don't re-index
        for (const v of batch) existingIds.add(v.videoId);
      }
    }
  }

  // Prune videos from removed sources
  if (PRUNE) {
    console.log("\n── Pruning removed sources ──");
    const handles = Array.from(validHandles);
    if (handles.length > 0) {
      // Delete videos whose channel_handle is not in the current config
      const { data: toDelete } = await supabase
        .from("topic_videos")
        .select("id, channel_handle, title")
        .not("channel_handle", "in", `(${handles.map((h) => `"${h}"`).join(",")})`);

      if (toDelete && toDelete.length > 0) {
        console.log(`  Removing ${toDelete.length} videos from deleted sources`);
        const ids = toDelete.map((r) => r.id);
        await supabase.from("topic_videos").delete().in("id", ids);
      } else {
        console.log("  Nothing to prune");
      }
    }
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
