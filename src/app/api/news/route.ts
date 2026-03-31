// src/app/api/news/route.ts
import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { RSS_FEEDS, NewsItem } from "@/lib/feeds";

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; NewsTerminal/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

// Cache in memory for 10 minutes to avoid hammering RSS feeds
let cache: { data: NewsItem[]; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function makeId(item: { link?: string; title?: string }): string {
  return Buffer.from((item.link || item.title || Math.random().toString())).toString("base64").slice(0, 16);
}

export async function GET() {
  // Return cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ items: cache.data, cached: true });
  }

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

  // Sort by date, newest first
  results.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const deduped = results.filter((item) => {
    const key = item.title.slice(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  cache = { data: deduped, ts: Date.now() };

  return NextResponse.json({ items: deduped, cached: false });
}
