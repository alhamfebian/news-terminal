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
    label: "FOREIGN ECONOMY",
  },
  {
    url: "https://www.ft.com/rss/home/uk",
    source: "Financial Times",
    category: "economy",
    label: "FOREIGN ECONOMY",
  },
  {
    url: "https://feeds.bloomberg.com/markets/news.rss",
    source: "Bloomberg",
    category: "economy",
    label: "FOREIGN ECONOMY",
  },

  // Indonesia Economy
  {
    url: "https://www.republika.co.id/rss/ekonomi/",
    source: "Republika.com",
    category: "indonesiaEconomy",
    label: "INDONESIA ECONOMY",
  },
  {
    url: "https://rss.tempo.co/bisnis",
    source: "Tempo.com",
    category: "indonesiaEconomy",
    label: "INDONESIA ECONOMY",
  },
  {
    url: "https://www.cnbcindonesia.com/market/rss/",
    source: "CNBC Indonesia",
    category: "indonesiaEconomy",
    label: "INDONESIA ECONOMY",
  },
  {
    url: "https://muratara.jurnalis.id/rss/category-id/14",
    source: "Jurnalis.id",
    category: "indonesiaEconomy",
    label: "INDONESIA ECONOMY",
  },

  // Indonesia News
  {
    url: "https://rss.kompas.com/api/feed/social?apikey=bc58c81819dff4b8d5c53540a2fc7ffd83e6314a",
    source: "Kompas.com",
    category: "indonesiaNews",
    label: "INDONESIA NEWS",
  },
  {
    url: "https://rss.tempo.co/bisnis",
    source: "Tempo.com",
    category: "indonesiaNews",
    label: "INDONESIA NEWS",
  },
  {
    url: "https://news.detik.com/berita/rss",
    source: "Detik.com",
    category: "indonesiaNews",
    label: "INDONESIA NEWS",
  },
  {
    url: "https://muratara.jurnalis.id/rss/latest-posts",
    source: "Jurnalis.id",
    category: "indonesiaNews",
    label: "INDONESIA NEWS",
  },

  // Geopolitics
  {
    url: "https://feeds.reuters.com/reuters/worldNews",
    source: "Reuters World",
    category: "geopolitics",
    label: "GEOPOLITICS",
  },
  {
    url: "https://rss.dw.com/rdf/rss-en-world",
    source: "DW",
    category: "geopolitics",
    label: "GEOPOLITICS",
  },
  {
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    source: "Al Jazeera",
    category: "geopolitics",
    label: "GEOPOLITICS",
  },
  {
    url: "https://foreignpolicy.com/feed/",
    source: "Foreign Policy",
    category: "geopolitics",
    label: "GEOPOLITICS",
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
