"use client";
import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import type { NewsItem } from "@/lib/feeds";

// ─── Types ────────────────────────────────────────────────────────────────────
type Cat = "all" | "food" | "economy" | "geopolitics";
type ChatMsg = { role: "user" | "assistant"; content: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

const CAT_LABELS: Record<Cat, string> = {
  all: "SEMUA",
  food: "PANGAN",
  economy: "EKONOMI",
  geopolitics: "GEOPOLITIK",
};

const CAT_COLORS: Record<string, string> = {
  food: "#1ec494",
  economy: "#3080e0",
  geopolitics: "#e84050",
};

const QUICK_PROMPTS = [
  "Rangkum 3 berita terpenting hari ini",
  "Berita mana yang paling berdampak ke Indonesia?",
  "Ada tren apa di industri pangan global?",
  "Analisis situasi geopolitik terkini",
  "Bagaimana kondisi ekonomi global saat ini?",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TopBar({ count, lastRefresh, onRefresh, loading }: {
  count: number; lastRefresh: Date | null; onRefresh: () => void; loading: boolean;
}) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: "var(--bg-1)",
      borderBottom: "1px solid var(--border)",
      padding: "0 14px",
      height: "38px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      flexShrink: 0,
    }}>
      <div style={{ color: "var(--gold)", fontWeight: 600, fontSize: "13px", letterSpacing: "3px", flexShrink: 0 }}>
        ◆ TERMINAL
      </div>
      <div style={{ color: "var(--text-2)", fontSize: "10px", letterSpacing: "1px" }}>
        PANGAN · EKONOMI · GEOPOLITIK
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <span style={{ color: "var(--text-2)", fontSize: "10px" }}>
          {count} berita
          {lastRefresh && ` · diperbarui ${timeAgo(lastRefresh.toISOString())}`}
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: "transparent",
            border: "1px solid var(--border-bright)",
            color: loading ? "var(--text-3)" : "var(--text-1)",
            padding: "3px 10px",
            fontSize: "10px",
            letterSpacing: "1px",
          }}
        >
          {loading ? "MEMUAT..." : "↻ REFRESH"}
        </button>
        <span style={{ color: "var(--gold)", fontSize: "11px", letterSpacing: "1px" }}>
          {time.toLocaleTimeString("id-ID")} WIB
        </span>
      </div>
    </div>
  );
}

function CategoryTabs({ active, onChange, counts }: {
  active: Cat; onChange: (c: Cat) => void; counts: Record<string, number>;
}) {
  return (
    <div style={{
      background: "var(--bg-1)",
      borderBottom: "1px solid var(--border)",
      padding: "0 14px",
      display: "flex",
      gap: "2px",
      flexShrink: 0,
    }}>
      {(Object.keys(CAT_LABELS) as Cat[]).map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          style={{
            background: active === cat ? "var(--gold)" : "transparent",
            border: "none",
            borderBottom: active === cat ? "2px solid var(--gold)" : "2px solid transparent",
            color: active === cat ? "#000" : "var(--text-2)",
            padding: "8px 14px",
            fontSize: "10px",
            letterSpacing: "1.5px",
            fontWeight: active === cat ? 600 : 400,
            transition: "color 0.1s",
          }}
        >
          {CAT_LABELS[cat]}
          {cat !== "all" && (
            <span style={{ marginLeft: "6px", opacity: 0.6, fontSize: "9px" }}>
              ({counts[cat] || 0})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function NewsRow({ item, selected, onClick }: {
  item: NewsItem; selected: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        borderBottom: "1px solid var(--bg-3)",
        padding: "9px 14px",
        cursor: "pointer",
        background: selected ? "var(--bg-3)" : "transparent",
        borderLeft: selected ? `2px solid var(--gold)` : "2px solid transparent",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)"; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ color: "var(--text-3)", fontSize: "10px", flexShrink: 0 }}>{fmtTime(item.isoDate)}</span>
        <span style={{ color: "var(--text-2)", fontSize: "10px", flexShrink: 0 }}>{item.source}</span>
        <span style={{
          fontSize: "9px",
          padding: "1px 6px",
          background: `${CAT_COLORS[item.category]}18`,
          color: CAT_COLORS[item.category],
          letterSpacing: "0.5px",
          flexShrink: 0,
        }}>
          {item.label}
        </span>
        <span style={{ color: "var(--text-3)", fontSize: "10px", marginLeft: "auto", flexShrink: 0 }}>
          {timeAgo(item.isoDate)}
        </span>
      </div>
      <div style={{
        color: selected ? "var(--text-0)" : "var(--text-1)",
        fontSize: "11px",
        lineHeight: "1.45",
        fontFamily: "var(--font-sans)",
      }}>
        {item.title}
      </div>
    </div>
  );
}

function DetailPane({ item, onAskAI }: { item: NewsItem | null; onAskAI: (q: string) => void }) {
  if (!item) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-3)", fontSize: "11px", letterSpacing: "1px",
        flexDirection: "column", gap: "8px",
      }}>
        <div style={{ fontSize: "24px", opacity: 0.3 }}>◈</div>
        <div>Pilih berita untuk membaca detail</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
        <span style={{
          fontSize: "9px", padding: "2px 8px",
          background: `${CAT_COLORS[item.category]}18`,
          color: CAT_COLORS[item.category],
          letterSpacing: "1px",
        }}>
          {item.label}
        </span>
        <span style={{ color: "var(--text-2)", fontSize: "10px" }}>{item.source}</span>
        <span style={{ color: "var(--text-3)", fontSize: "10px" }}>{timeAgo(item.isoDate)}</span>
      </div>

      <div style={{
        color: "var(--text-0)",
        fontSize: "14px",
        lineHeight: "1.6",
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        marginBottom: "12px",
      }}>
        {item.title}
      </div>

      {item.summary && (
        <div style={{
          color: "var(--text-1)",
          fontSize: "12px",
          lineHeight: "1.7",
          fontFamily: "var(--font-sans)",
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border)",
        }}>
          {item.summary}
        </div>
      )}

      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          border: "1px solid var(--border-bright)",
          color: "var(--text-1)",
          padding: "5px 14px",
          fontSize: "10px",
          letterSpacing: "1px",
          marginBottom: "16px",
        }}
      >
        BACA ARTIKEL LENGKAP ↗
      </a>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
        <div style={{ color: "var(--text-3)", fontSize: "10px", letterSpacing: "1px", marginBottom: "8px" }}>
          TANYA AI TENTANG BERITA INI
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {[
            `Jelaskan konteks "${item.title.slice(0, 40)}..."`,
            "Apa dampaknya ke Indonesia?",
            "Hubungkan dengan berita lain yang relevan",
          ].map((q) => (
            <button
              key={q}
              onClick={() => onAskAI(q)}
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
                padding: "6px 10px",
                fontSize: "10px",
                textAlign: "left",
                letterSpacing: "0.3px",
                transition: "border-color 0.1s, color 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-dim)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
              }}
            >
              ▸ {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const ChatPane = forwardRef<{ sendMessage: (q: string) => void }, { news: NewsItem[] }>(function ChatPane({ news }, ref) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Selamat datang di News Terminal. Saya siap membantu mengkurasi dan menganalisis berita untuk Anda. Tanya saja apa yang ingin Anda ketahui.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  const sendMessage = useCallback(async (text?: string) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");

    const userMsg: ChatMsg = { role: "user", content: q };
    setMsgs((prev) => [...prev, userMsg]);
    setLoading(true);

    const newsContext = news
      .slice(0, 30)
      .map((n) => `[${n.source}][${n.label}] ${n.title}${n.summary ? ` — ${n.summary.slice(0, 120)}` : ""}`)
      .join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...msgs, userMsg].map((m) => ({ role: m.role, content: m.content })),
          newsContext,
        }),
      });
      const data = await res.json();
      setMsgs((prev) => [...prev, { role: "assistant", content: data.reply || "Maaf, terjadi kesalahan." }]);
    } catch {
      setMsgs((prev) => [...prev, { role: "assistant", content: "Koneksi ke AI gagal. Coba lagi." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, msgs, news]);

  // Expose sendMessage so parent can call it
  (ChatPane as any)._send = sendMessage;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        background: "var(--bg-1)",
        borderBottom: "1px solid var(--border)",
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
      }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)" }} />
        <span style={{ color: "var(--green)", fontSize: "10px", letterSpacing: "1.5px" }}>AI CURATOR</span>
      </div>

      <div ref={msgsRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "92%",
            background: m.role === "user" ? "var(--bg-3)" : "var(--bg-2)",
            borderLeft: m.role === "assistant" ? "2px solid var(--green-dim)" : "none",
            padding: "7px 10px",
            fontSize: "11px",
            lineHeight: "1.6",
            color: m.role === "user" ? "var(--text-1)" : "var(--text-0)",
            whiteSpace: "pre-wrap",
            fontFamily: "var(--font-sans)",
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: "flex-start",
            background: "var(--bg-2)",
            borderLeft: "2px solid var(--green-dim)",
            padding: "7px 10px",
            fontSize: "11px",
            color: "var(--text-3)",
            fontStyle: "italic",
          }}>
            menganalisis...
          </div>
        )}
      </div>

      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
          {QUICK_PROMPTS.slice(0, 3).map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
                padding: "3px 8px",
                fontSize: "10px",
                letterSpacing: "0.2px",
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Tanya atau minta kurasi berita..."
            style={{
              flex: 1,
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRight: "none",
              color: "var(--text-0)",
              padding: "7px 10px",
              fontSize: "11px",
              outline: "none",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              background: input.trim() && !loading ? "var(--gold)" : "var(--bg-3)",
              border: "1px solid var(--border)",
              color: input.trim() && !loading ? "#000" : "var(--text-3)",
              padding: "0 14px",
              fontSize: "10px",
              letterSpacing: "1px",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            KIRIM
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Terminal() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeCat, setActiveCat] = useState<Cat>("all");
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [rightPane, setRightPane] = useState<"detail" | "chat">("detail");
  const chatRef = useRef<{ sendMessage: (q: string) => void } | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(data.items || []);
      setLastRefresh(new Date());
    } catch {
      // keep existing news
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const filtered = activeCat === "all" ? news : news.filter((n) => n.category === activeCat);
  const counts = news.reduce<Record<string, number>>((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1;
    return acc;
  }, {});

  const handleAskAI = useCallback((q: string) => {
    setRightPane("chat");
    setTimeout(() => {
      (ChatPane as any)._send?.(q);
    }, 100);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar count={news.length} lastRefresh={lastRefresh} onRefresh={fetchNews} loading={loading} />
      <CategoryTabs active={activeCat} onChange={setActiveCat} counts={counts} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", flex: 1, minHeight: 0, gap: "0" }}>
        {/* Left: news list */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", overflow: "hidden" }}>
          {loading && news.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", letterSpacing: "2px", fontSize: "11px" }}>
              MEMUAT BERITA...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: "11px" }}>
              Tidak ada berita tersedia
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.map((item) => (
                <NewsRow
                  key={item.id}
                  item={item}
                  selected={selectedItem?.id === item.id}
                  onClick={() => { setSelectedItem(item); setRightPane("detail"); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: detail + chat */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Toggle */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-1)",
            flexShrink: 0,
          }}>
            {(["detail", "chat"] as const).map((pane) => (
              <button
                key={pane}
                onClick={() => setRightPane(pane)}
                style={{
                  flex: 1,
                  background: rightPane === pane ? "var(--bg-0)" : "transparent",
                  border: "none",
                  borderBottom: rightPane === pane ? `2px solid var(--gold)` : "2px solid transparent",
                  color: rightPane === pane ? "var(--gold)" : "var(--text-2)",
                  padding: "7px",
                  fontSize: "10px",
                  letterSpacing: "1.5px",
                }}
              >
                {pane === "detail" ? "▸ DETAIL BERITA" : "◈ AI CURATOR"}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {rightPane === "detail"
              ? <DetailPane item={selectedItem} onAskAI={(q) => { setRightPane("chat"); setTimeout(() => (ChatPane as any)._send?.(q), 100); }} />
              : <ChatPane news={news} ref={chatRef} />
            }
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        background: "var(--gold)",
        padding: "2px 14px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexShrink: 0,
      }}>
        <span style={{ color: "#000", fontSize: "10px", fontWeight: 600, letterSpacing: "1px" }}>● LIVE</span>
        <span style={{ color: "#3a2800", fontSize: "10px" }}>
          {news.length} berita dari {Array.from(new Set(news.map((n) => n.source))).length} sumber
        </span>
        <span style={{ marginLeft: "auto", color: "#3a2800", fontSize: "10px" }}>
          DATA DIPERBARUI SETIAP 10 MENIT · BERITA GRATIS VIA RSS
        </span>
      </div>
    </div>
  );
}
