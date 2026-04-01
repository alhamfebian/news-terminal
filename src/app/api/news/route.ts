// src/app/api/news/route.ts
import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { RSS_FEEDS, NewsItem } from "@/lib/feeds";

// Tell Next.js to revalidate this route every 10 minutes.
// Works on Netlify with @netlify/plugin-nextjs.
export const revalidate = 600;

const CACHE_TTL = 10 * 60 * 1000;

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; NewsTerminal/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

// Module-level cache — effective in local dev / long-lived server environments
let _cache: { data: NewsItem[]; ts: number } | null = null;

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function makeId(item: { link?: string; title?: string }): string {
  const raw = item.link || item.title || Math.random().toString();
  return Buffer.from(raw).toString("base64").slice(0, 16);
}

async function fetchAllFeeds(): Promise<NewsItem[]> {
  const results: NewsItem[] = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        const items = (parsed.items || []).slice(0, 8).map((item) => ({
          id: makeId(item),
          title: item.title || "",
          link: item.link || "",
          pubDate: item.pubDate || item.isoDate || "",
          isoDate: item.isoDate || item.pubDate || new Date().toISOString(),
          source: feed.source,
          category: feed.category as NewsItem["category"],
          label: feed.label,
          summary: stripHtml(item.contentSnippet || item.content || item.summary || ""),
        }));
        results.push(...items);
      } catch {
        // Feed failed silently — others continue
      }
    })
  );

  results.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());

  const seen = new Set<string>();
  return results.filter((item) => {
    const key = item.title.slice(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET() {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return NextResponse.json({
      items: _cache.data,
      cached: true,
      nextRefresh: _cache.ts + CACHE_TTL,
    });
  }

  const data = await fetchAllFeeds();
  const ts = Date.now();
  _cache = { data, ts };

  return NextResponse.json({
    items: data,
    cached: false,
    nextRefresh: ts + CACHE_TTL,
  });
}
