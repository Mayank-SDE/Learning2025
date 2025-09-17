#!/usr/bin/env node
/**
 * YouTube Playlist PRO Analyzer
 * Node 18+ (uses global fetch)
 *
 * Usage:
 *   node yt_playlist_pro.mjs "<playlist URL or ID>"
 *     [--speed 1.25]
 *     [--range 5-42]
 *     [--filter "regex on title"]
 *     [--since 2024-01-01] [--until 2025-12-31]
 *     [--min 3] [--max 60]              // minutes
 *     [--sort duration|title|date] [--desc]
 *     [--export csv|json]
 *
 * Examples:
 *   node yt_playlist_pro.mjs PLZVBmp... --speed 1.5 --filter "DSA|System Design" --min 5 --max 40 --sort duration --desc --export csv
 */

import fs from "fs/promises";
import path from "path";

const API_KEY = process.env.YT_API_KEY;
if (!API_KEY) {
  console.error("Error: Please set YT_API_KEY env var (YouTube Data API v3 key).");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node yt_playlist_pro.mjs <playlist URL or ID> [options]");
  process.exit(1);
}
const getArgVal = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : fallback;
};
const has = (flag) => args.includes(flag);

const rawInput = args[0];
const speed = parseFloat(getArgVal("--speed", "1")) || 1;
const rangeStr = getArgVal("--range", "");
const filterRegex = getArgVal("--filter", "");
const sinceStr = getArgVal("--since", "");
const untilStr = getArgVal("--until", "");
const minMin = parseFloat(getArgVal("--min", "0")) || 0;
const maxMin = parseFloat(getArgVal("--max", "0")) || 0;
const sortKey = getArgVal("--sort", ""); // duration|title|date
const desc = has("--desc");
const exportFmt = getArgVal("--export", ""); // csv|json

let rangeStart = 1, rangeEnd = Infinity;
if (rangeStr) {
  const m = String(rangeStr).match(/^(\d+)-(\d+)$/);
  if (!m) {
    console.error("Invalid --range. Use like: --range 5-42");
    process.exit(1);
  }
  rangeStart = Math.max(1, parseInt(m[1], 10));
  rangeEnd = Math.max(rangeStart, parseInt(m[2], 10));
}

function extractPlaylistId(input) {
  try {
    const u = new URL(input);
    return u.searchParams.get("list") || input;
  } catch {
    return input;
  }
}
const playlistId = extractPlaylistId(rawInput);

function iso8601ToSeconds(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + min * 60 + s;
}
function formatHMS(totalSeconds) {
  const s = Math.abs(Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
function parseDate(d) {
  if (!d) return null;
  const t = Date.parse(d);
  return isNaN(t) ? null : new Date(t);
}

async function apiFetch(url, retries = 3) {
  while (retries--) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status >= 500) {
      await new Promise(r => setTimeout(r, 600 * (3 - retries)));
      continue;
    }
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  throw new Error("Network failed after retries");
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

    const data = await apiFetch(url);
    for (const it of data.items || []) {
      const vid = it?.contentDetails?.videoId;
      if (vid) {
        items.push({
          videoId: vid,
          title: it?.snippet?.title || "",
          channelTitle: it?.snippet?.channelTitle || "",
          publishedAt: it?.contentDetails?.videoPublishedAt || it?.snippet?.publishedAt,
        });
      }
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return items;
}

async function fetchVideoDurations(videoIds) {
  const durations = new Map(); // id -> seconds
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("id", chunk.join(","));
    url.searchParams.set("key", API_KEY);

    const data = await apiFetch(url);
    for (const v of data.items || []) {
      durations.set(v.id, iso8601ToSeconds(v?.contentDetails?.duration || "PT0S"));
    }
    for (const id of chunk) if (!durations.has(id)) durations.set(id, 0);
  }
  return durations;
}

function withinRange(idx, total) {
  const i = idx + 1; // 1-indexed
  return i >= rangeStart && i <= Math.min(rangeEnd, total);
}

function csvEscape(s) {
  if (s == null) return "";
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

(async () => {
  try {
    console.log(`\n▶ Fetching playlist: ${playlistId}`);
    const all = await fetchAllPlaylistItems(playlistId);
    if (all.length === 0) {
      console.log("No items found or playlist is private/unavailable.");
      process.exit(0);
    }

    // Range slice
    const ranged = all.filter((_, i) => withinRange(i, all.length));

    // Filters
    let re = null;
    if (filterRegex) {
      try { re = new RegExp(filterRegex, "i"); } catch { console.warn("Invalid --filter regex; ignored."); }
    }
    const since = parseDate(sinceStr);
    const until = parseDate(untilStr);

    let filtered = ranged.filter(v => {
      const keepTitle = re ? re.test(v.title) : true;
      const d = parseDate(v.publishedAt);
      const keepSince = since ? (d && d >= since) : true;
      const keepUntil = until ? (d && d <= until) : true;
      return keepTitle && keepSince && keepUntil;
    });

    // Fetch durations
    const ids = filtered.map(v => v.videoId);
    const durationMap = await fetchVideoDurations(ids);

    // Duration min/max (minutes)
    filtered = filtered.filter(v => {
      const sec = durationMap.get(v.videoId) || 0;
      const min = sec / 60;
      if (minMin && min < minMin) return false;
      if (maxMin && min > maxMin) return false;
      return true;
    }).map(v => ({
      ...v,
      seconds: durationMap.get(v.videoId) || 0
    }));

    // Sorting
    if (sortKey) {
      const cmp = {
        "duration": (a, b) => a.seconds - b.seconds,
        "title":    (a, b) => a.title.localeCompare(b.title),
        "date":     (a, b) => (parseDate(a.publishedAt) || 0) - (parseDate(b.publishedAt) || 0),
      }[sortKey] || (() => 0);
      filtered.sort(cmp);
      if (desc) filtered.reverse();
    }

    // Totals
    const totalCount = all.length;
    const usedCount = filtered.length;
    const totalSec = filtered.reduce((s, v) => s + v.seconds, 0);
    const atSpeed = totalSec / Math.max(0.1, speed);

    // Output summary
    console.log(`\n=== Playlist Summary ===`);
    console.log(`Total items in playlist: ${totalCount}`);
    console.log(`Count after range/filters: ${usedCount}`);
    console.log(`Normal speed: ${formatHMS(totalSec)} (${(totalSec/3600).toFixed(2)} h)`);
    if (speed !== 1) {
      console.log(`At ${speed}x:   ${formatHMS(atSpeed)} (${(atSpeed/3600).toFixed(2)} h)`);
    }

    // Top 5 longest videos
    const top = [...filtered].sort((a,b)=>b.seconds-a.seconds).slice(0,5);
    if (top.length) {
      console.log(`\nTop ${top.length} longest:`);
      top.forEach((v,i)=>{
        console.log(`${String(i+1).padStart(2," ")}. ${formatHMS(v.seconds)}  | ${v.title}`);
      });
    }

    // Export
    if (exportFmt) {
      await fs.mkdir(path.join(process.cwd(), "out"), { recursive: true });
      if (exportFmt === "json") {
        const json = filtered.map(v => ({
          videoId: v.videoId,
          title: v.title,
          channel: v.channelTitle,
          publishedAt: v.publishedAt,
          seconds: v.seconds,
          hms: formatHMS(v.seconds),
        }));
        const file = path.join("out", "playlist.json");
        await fs.writeFile(file, JSON.stringify(json, null, 2));
        console.log(`\nSaved JSON → ${file}`);
      } else if (exportFmt === "csv") {
        const header = ["videoId","title","channel","publishedAt","seconds","hms"].join(",");
        const rows = filtered.map(v => [
          csvEscape(v.videoId),
          csvEscape(v.title),
          csvEscape(v.channelTitle),
          csvEscape(v.publishedAt),
          v.seconds,
          formatHMS(v.seconds),
        ].join(","));
        const file = path.join("out", "playlist.csv");
        await fs.writeFile(file, [header, ...rows].join("\n"));
        console.log(`\nSaved CSV → ${file}`);
      } else {
        console.warn("Unknown --export format. Use csv|json.");
      }
    }

    // Rough quota math (public estimate; actual may vary)
    // playlistItems: ~ceil(total/50) calls * 1 unit each
    // videos.list:   ~ceil(used/50) calls * 1 unit each
    const callsPlaylist = Math.ceil(totalCount / 50);
    const callsVideos = Math.ceil(usedCount / 50);
    console.log(`\nQuota (est.): playlistItems=${callsPlaylist}, videos.list=${callsVideos}, total=${callsPlaylist + callsVideos} units.`);

  } catch (err) {
    console.error("\nFailed:", err?.message || err);
    process.exit(1);
  }
})();
