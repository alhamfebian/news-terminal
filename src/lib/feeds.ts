// src/lib/feeds.ts
// Free RSS feeds covering food industry, economy, and geopolitics

export const RSS_FEEDS = [
  // Food Industry
  {
    url: "https://www.foodnavigator.com/rss/topic/industry",
    source: "FoodNavigator",
    category: "food",
    label: "FOOD",
  },
  {
    url: "https://www.foodbusinessnews.net/rss/news",
    source: "Food Business News",
    category: "food",
    label: "FOOD",
  },
  {
    url: "https://www.just-food.com/feed/",
    source: "Just Food",
    category: "food",
    label: "FOOD",
  },

  // Economy / Business
  {
    url: "https://feeds.reuters.com/reuters/businessNews",
    source: "Reuters",
    category: "economy",
    label: "EKONOMI",
  },
  {
    url: "https://www.ft.com/rss/home/uk",
    source: "Financial Times",
    category: "economy",
    label: "EKONOMI",
  },
  {
    url: "https://feeds.bloomberg.com/markets/news.rss",
    source: "Bloomberg",
    category: "economy",
    label: "EKONOMI",
  },

  // Indonesia Economy
  {
    url: "https://news.detik.com/berita/rss",
    source: "Detik.com",
    category: "economy",
    label: "EKONOMI",
  },
  {
    url: "https://rss.tempo.co/bisnis",
    source: "Tempo.com",
    category: "economy",
    label: "EKONOMI",
  },

  // Geopolitics
  {
    url: "https://feeds.reuters.com/reuters/worldNews",
    source: "Reuters World",
    category: "geopolitics",
    label: "GEOPOLITIK",
  },
  {
    url: "https://rss.dw.com/rdf/rss-en-world",
    source: "DW",
    category: "geopolitics",
    label: "GEOPOLITIK",
  },
  {
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    source: "Al Jazeera",
    category: "geopolitics",
    label: "GEOPOLITIK",
  },
  {
    url: "https://foreignpolicy.com/feed/",
    source: "Foreign Policy",
    category: "geopolitics",
    label: "GEOPOLITIK",
  },
];

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: "food" | "economy" | "geopolitics";
  label: string;
  summary: string;
  isoDate: string;
};
