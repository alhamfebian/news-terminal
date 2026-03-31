# News Terminal

Personal Bloomberg-style news terminal focused on food industry, economy, and geopolitics.

Built with: Next.js 14, TypeScript, RSS feeds (free), Claude AI for news curation.

---

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key
# Get it free at: https://console.anthropic.com

# 3. Run locally
npm run dev
# Open http://localhost:3000
```

---

## Deploy ke Netlify

### Option A — Via GitHub (Recommended)

1. **Push ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/USERNAME/news-terminal.git
   git push -u origin main
   ```

2. **Connect di Netlify:**
   - Login ke [netlify.com](https://netlify.com)
   - Klik **"Add new site" → "Import an existing project"**
   - Pilih GitHub → pilih repo `news-terminal`
   - Build settings sudah otomatis terbaca dari `netlify.toml`

3. **Set Environment Variable:**
   - Di Netlify Dashboard → Site settings → Environment variables
   - Tambahkan: `ANTHROPIC_API_KEY` = `sk-ant-...` (key Anda)

4. **Deploy!** Klik Deploy Site. Selesai.

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set ANTHROPIC_API_KEY sk-ant-xxxxx
netlify deploy --build --prod
```

---

## Menambah RSS Feed Baru

Edit file `src/lib/feeds.ts` dan tambahkan feed baru ke array `RSS_FEEDS`:

```typescript
{
  url: "https://example.com/rss",
  source: "Nama Sumber",
  category: "food", // "food" | "economy" | "geopolitics"
  label: "LABEL",
},
```

### RSS Feed Gratis yang Bisa Ditambahkan

**Makanan / Pangan:**
- https://www.fooddive.com/feeds/news/
- https://agfundernews.com/feed
- https://www.globalagtechinitiative.com/feed/

**Ekonomi Indonesia:**
- https://ekonomi.kompas.com/rss
- https://www.cnbcindonesia.com/rss
- https://www.republika.co.id/rss/ekonomi

**Geopolitik:**
- https://theconversation.com/us/topics/geopolitics/articles.atom
- https://carnegieendowment.org/rss/solr.xml
- https://www.lowyinstitute.org/the-interpreter/rss.xml

---

## Struktur Project

```
news-terminal/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── news/route.ts    ← RSS feed parser (server)
│   │   │   └── chat/route.ts    ← Claude AI endpoint (server)
│   │   ├── globals.css          ← Terminal dark theme
│   │   ├── layout.tsx
│   │   └── page.tsx             ← Main terminal UI
│   └── lib/
│       └── feeds.ts             ← RSS feed list & types
├── .env.example                 ← Template env vars
├── netlify.toml                 ← Netlify config
├── next.config.js
└── package.json
```

---

## Cara Kerja

1. **RSS Feeds** — Server Next.js mengambil berita dari RSS feed gratis setiap 10 menit (di-cache di memory). Tidak perlu database.

2. **AI Curator** — Chat dengan Claude yang sudah tahu konteks semua berita di feed. Bisa diminta rangkum, analisis dampak, atau cari koneksi antar berita.

3. **Hosting** — Netlify + Serverless Functions untuk API routes. Gratis untuk personal use.

---

## Upgrade di Masa Depan

- [ ] Simpan berita ke database (Supabase/PlanetScale) agar histori tidak hilang saat restart
- [ ] Tambah notifikasi email/Telegram untuk berita penting
- [ ] Tambah fitur bookmark berita
- [ ] Custom RSS feed dari dashboard
- [ ] Gunakan NewsAPI.org untuk berita lebih lengkap (freemium)
