#!/usr/bin/env node
/**
 * YouTube Playlist Duration Calculator
 * Node 18+ (uses global fetch)
 *
 * Usage:
 *   node yt_playlist_duration.mjs "<playlist URL or ID>" [--speed 1.5] [--range 1-50]
 *
 * Examples:
 *   node yt_playlist_duration.mjs "https://www.youtube.com/watch?v=dX-3R2TH5qE&list=PLZVBmpM0E_DHlA9Fz4QznfPjUKPIz48I7"
 *   node yt_playlist_duration.mjs PLZVBmpM0E_DHlA9Fz4QznfPjUKPIz48I7 --speed 1.25
 *   node yt_playlist_duration.mjs PLZVBmpM0E_DHlA9Fz4QznfPjUKPIz48I7 --range 5-42
 *
 * Requirements:
 *   1) Create a YouTube Data API v3 key and export it as env var: YT_API_KEY
 *      - https://console.cloud.google.com/apis/library/youtube.googleapis.com
 *   2) Node.js v18+ (for global fetch)
 * 
 * Running Instructions :- 
 * # 1) Node 18+ recommended
node -v

# 2) Set your API key (replace XXXX with your key)
export YT_API_KEY=AIzaSyD4qOjrij4joGBJfZ5AykNsdvTaCYo5KyI

# 3) Run with your playlist URL (your link works fine)
node yt_playlist_duration.mjs "https://www.youtube.com/watch?v=dX-3R2TH5qE&list=PLZVBmpM0E_DHlA9Fz4QznfPjUKPIz48I7"

# Optional: at 1.5x speed
node yt_playlist_duration.mjs PLZVBmpM0E_DHlA9Fz4QznfPjUKPIz48I7 --speed 1.5

# Optional: only videos 5–42
node yt_playlist_duration.mjs PLZVBmpM0E_DHlA9Fz4QznfPjUKPIz48I7 --range 5-42

 */

const API_KEY = process.env.YT_API_KEY;
if (!API_KEY) {
  console.error("Error: Please set environment variable YT_API_KEY (YouTube Data API v3 key).");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node yt_playlist_duration.mjs <playlist URL or ID> [--speed 1.5] [--range 1-50]");
  process.exit(1);
}

const rawInput = args[0];
const speed = parseFloat((() => {
  const i = args.indexOf("--speed");
  return i !== -1 ? args[i + 1] : "1";
})()) || 1;

let rangeStart = 1, rangeEnd = Infinity;
(() => {
  const i = args.indexOf("--range");
  if (i !== -1) {
    const m = String(args[i + 1] || "").match(/^(\d+)-(\d+)$/);
    if (!m) {
      console.error("Invalid --range. Use like: --range 5-42");
      process.exit(1);
    }
    rangeStart = Math.max(1, parseInt(m[1], 10));
    rangeEnd = Math.max(rangeStart, parseInt(m[2], 10));
  }
})();

function extractPlaylistId(input) {
  try {
    // If it's a URL, read the 'list' param
    const u = new URL(input);
    return u.searchParams.get("list") || input;
  } catch {
    // Not a URL — assume it's already a playlist ID
    return input;
  }
}

const playlistId = extractPlaylistId(rawInput);

function iso8601ToSeconds(iso) {
  // e.g., PT1H2M3S, PT15M, PT2H, PT0S
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + min * 60 + s;
}

function formatHMS(totalSeconds) {
  const sign = totalSeconds < 0 ? "-" : "";
  const s = Math.abs(Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

async function fetchAllPlaylistItems(pid) {
  const items = [];
  let pageToken = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "contentDetails,snippet");
    url.searchParams.set("playlistId", pid);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", API_KEY);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`playlistItems error ${res.status}: ${t}`);
    }
    const data = await res.json();
    for (const it of data.items || []) {
      // Ignore deleted/private entries with missing videoId
      const vid = it?.contentDetails?.videoId;
      if (vid) items.push({
        videoId: vid,
        title: it?.snippet?.title || "",
        publishedAt: it?.contentDetails?.videoPublishedAt || it?.snippet?.publishedAt
      });
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return items;
}

async function fetchVideoDurations(videoIds) {
  // YouTube videos.list supports up to 50 IDs per call
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const durations = new Map(); // id -> seconds
  for (const chunk of chunks) {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("id", chunk.join(","));
    url.searchParams.set("key", API_KEY);

    const res = await fetch(url);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`videos.list error ${res.status}: ${t}`);
    }
    const data = await res.json();
    for (const v of data.items || []) {
      const id = v.id;
      const iso = v?.contentDetails?.duration || "PT0S";
      durations.set(id, iso8601ToSeconds(iso));
    }
    // Some IDs may be missing (removed/region-locked/etc.); leave as 0 if not returned
    for (const id of chunk) {
      if (!durations.has(id)) durations.set(id, 0);
    }
  }
  return durations;
}

(async () => {
  try {
    console.log(`Fetching playlist: ${playlistId} ...`);
    const items = await fetchAllPlaylistItems(playlistId);
    if (items.length === 0) {
      console.log("No items found or playlist is private/unavailable.");
      process.exit(0);
    }

    const totalCount = items.length;

    // Apply optional --range (1-indexed)
    const sliced = items.slice(rangeStart - 1, Math.min(rangeEnd, totalCount));
    const ids = sliced.map(i => i.videoId);

    console.log(`Videos counted: ${sliced.length} (of ${totalCount} total in playlist)`);
    const durationsMap = await fetchVideoDurations(ids);

    const seconds = ids.reduce((sum, id) => sum + (durationsMap.get(id) || 0), 0);
    const atSpeed = seconds / Math.max(0.1, speed);

    // Print results
    console.log("\n=== Playlist Duration ===");
    console.log(`Normal speed:   ${formatHMS(seconds)}  (${(seconds / 3600).toFixed(2)} hours)`);
    if (speed !== 1) {
      console.log(`At ${speed}x:       ${formatHMS(atSpeed)}  (${(atSpeed / 3600).toFixed(2)} hours)`);
    }

    // Optional: small breakdown
    const zeroDur = ids.filter(id => (durationsMap.get(id) || 0) === 0).length;
    if (zeroDur > 0) {
      console.log(`\nNote: ${zeroDur} videos returned 0s (possibly live/private/region-locked).`);
    }
  } catch (err) {
    console.error("Failed:", err.message || err);
    process.exit(1);
  }
})();
