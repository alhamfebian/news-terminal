"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { NewsItem } from "@/lib/feeds";

type Cat = "all" | "food" | "economy" | "geopolitics";
type ChatMsg = { role: "user" | "assistant"; content: string };
type Sheet = null | "detail" | "chat";

// ─── Breakpoints ──────────────────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return bp;
}

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
  all: "SEMUA", food: "PANGAN", economy: "EKONOMI", geopolitics: "GEOPOLITIK",
};
const CAT_COLORS: Record<string, string> = {
  food: "#1ec494", economy: "#3080e0", geopolitics: "#e84050",
};
const QUICK_PROMPTS = [
  "Rangkum 3 berita terpenting hari ini",
  "Berita mana yang paling berdampak ke Indonesia?",
  "Ada tren apa di industri pangan global?",
  "Analisis situasi geopolitik terkini",
];

// ─── Global AI trigger ────────────────────────────────────────────────────────
let _globalSend: ((q: string) => void) | null = null;
function triggerAIChat(q: string) { setTimeout(() => _globalSend?.(q), 80); }

// ═════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function TopBar({ count, lastRefresh, onRefresh, loading, isMobile }: {
  count: number; lastRefresh: Date | null; onRefresh: () => void; loading: boolean; isMobile: boolean;
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
      height: isMobile ? "48px" : "38px",
      display: "flex", alignItems: "center", gap: "12px",
      flexShrink: 0,
    }}>
      <span style={{ color: "var(--gold)", fontWeight: 600, fontSize: isMobile ? "15px" : "13px", letterSpacing: "3px" }}>
        ◆ TERMINAL
      </span>
      {!isMobile && (
        <span style={{ color: "var(--text-2)", fontSize: "10px", letterSpacing: "1px" }}>
          PANGAN · EKONOMI · GEOPOLITIK
        </span>
      )}
      <div style={{ flex: 1 }} />
      {!isMobile && (
        <span style={{ color: "var(--text-2)", fontSize: "10px" }}>
          {count} berita{lastRefresh && ` · ${timeAgo(lastRefresh.toISOString())}`}
        </span>
      )}
      <button onClick={onRefresh} disabled={loading} style={{
        background: "transparent",
        border: "1px solid var(--border-bright)",
        color: loading ? "var(--text-3)" : "var(--text-1)",
        padding: "0 12px",
        height: isMobile ? "36px" : "26px",
        fontSize: isMobile ? "16px" : "10px",
        minWidth: "44px",
      }}>
        {loading ? "…" : "↻"}
      </button>
      <span style={{ color: "var(--gold)", fontSize: isMobile ? "13px" : "11px", letterSpacing: "1px" }}>
        {time.toLocaleTimeString("id-ID", isMobile ? { hour: "2-digit", minute: "2-digit" } : undefined)} WIB
      </span>
    </div>
  );
}

function CategoryTabs({ active, onChange, counts, isMobile }: {
  active: Cat; onChange: (c: Cat) => void; counts: Record<string, number>; isMobile: boolean;
}) {
  return (
    <div style={{
      background: "var(--bg-1)", borderBottom: "1px solid var(--border)",
      display: "flex", flexShrink: 0, overflowX: "auto", scrollbarWidth: "none",
    }}>
      {(Object.keys(CAT_LABELS) as Cat[]).map((cat) => (
        <button key={cat} onClick={() => onChange(cat)} style={{
          background: "transparent", border: "none",
          borderBottom: active === cat ? "2px solid var(--gold)" : "2px solid transparent",
          color: active === cat ? "var(--gold)" : "var(--text-2)",
          padding: isMobile ? "13px 16px" : "8px 14px",
          fontSize: isMobile ? "12px" : "10px",
          letterSpacing: isMobile ? "0.5px" : "1.5px",
          fontWeight: active === cat ? 600 : 400,
          whiteSpace: "nowrap", flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
        }}>
          {CAT_LABELS[cat]}
          {cat !== "all" && (counts[cat] || 0) > 0 && (
            <span style={{ marginLeft: "5px", opacity: 0.45, fontSize: "9px" }}>{counts[cat]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function NewsRow({ item, selected, onClick, isMobile }: {
  item: NewsItem; selected: boolean; onClick: () => void; isMobile: boolean;
}) {
  return (
    <div onClick={onClick} style={{
      borderBottom: "1px solid var(--bg-3)",
      padding: isMobile ? "14px 16px" : "9px 14px",
      cursor: "pointer",
      background: selected ? "var(--bg-3)" : "transparent",
      borderLeft: selected ? "2px solid var(--gold)" : "2px solid transparent",
      WebkitTapHighlightColor: "transparent",
    }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "5px", flexWrap: "wrap" }}>
        <span style={{ color: "var(--text-3)", fontSize: "10px" }}>{fmtTime(item.isoDate)}</span>
        <span style={{ color: "var(--text-2)", fontSize: "10px" }}>{item.source}</span>
        <span style={{
          fontSize: "9px", padding: "1px 6px",
          background: `${CAT_COLORS[item.category]}18`,
          color: CAT_COLORS[item.category], letterSpacing: "0.5px",
        }}>{item.label}</span>
        <span style={{ color: "var(--text-3)", fontSize: "10px", marginLeft: "auto" }}>{timeAgo(item.isoDate)}</span>
      </div>
      <div style={{
        color: selected ? "var(--text-0)" : "var(--text-1)",
        fontSize: isMobile ? "14px" : "11px",
        lineHeight: "1.5", fontFamily: "var(--font-sans)",
      }}>
        {item.title}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DETAIL CONTENT
// ═════════════════════════════════════════════════════════════════════════════

function DetailContent({ item, onAskAI, isMobile }: {
  item: NewsItem; onAskAI: (q: string) => void; isMobile: boolean;
}) {
  return (
    <div style={{ padding: isMobile ? "20px 16px 32px" : "16px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
        <span style={{
          fontSize: "9px", padding: "2px 8px",
          background: `${CAT_COLORS[item.category]}18`,
          color: CAT_COLORS[item.category], letterSpacing: "1px",
        }}>{item.label}</span>
        <span style={{ color: "var(--text-2)", fontSize: "11px" }}>{item.source}</span>
        <span style={{ color: "var(--text-3)", fontSize: "11px" }}>{timeAgo(item.isoDate)}</span>
      </div>

      <div style={{
        color: "var(--text-0)",
        fontSize: isMobile ? "18px" : "14px",
        lineHeight: "1.6", fontFamily: "var(--font-sans)", fontWeight: 500,
        marginBottom: "16px",
      }}>
        {item.title}
      </div>

      {item.summary && (
        <div style={{
          color: "var(--text-1)",
          fontSize: isMobile ? "15px" : "12px",
          lineHeight: "1.8", fontFamily: "var(--font-sans)",
          marginBottom: "20px", paddingBottom: "20px",
          borderBottom: "1px solid var(--border)",
        }}>
          {item.summary}
        </div>
      )}

      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{
        display: "inline-flex", alignItems: "center",
        border: "1px solid var(--border-bright)", color: "var(--text-1)",
        padding: isMobile ? "12px 18px" : "5px 14px",
        fontSize: isMobile ? "13px" : "10px",
        letterSpacing: "1px", marginBottom: "24px",
        minHeight: isMobile ? "48px" : "auto",
      }}>
        BACA ARTIKEL LENGKAP ↗
      </a>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
        <div style={{ color: "var(--text-3)", fontSize: "10px", letterSpacing: "1px", marginBottom: "10px" }}>
          TANYA AI TENTANG BERITA INI
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            "Jelaskan konteks berita ini lebih dalam",
            "Apa dampaknya ke Indonesia?",
            "Hubungkan dengan berita lain yang relevan",
          ].map((q) => (
            <button key={q} onClick={() => onAskAI(`[Re: "${item.title.slice(0, 50)}..."] ${q}`)} style={{
              background: "var(--bg-2)", border: "1px solid var(--border)",
              color: "var(--text-2)",
              padding: isMobile ? "13px 14px" : "7px 10px",
              fontSize: isMobile ? "13px" : "10px",
              textAlign: "left", fontFamily: "var(--font-mono)",
              minHeight: isMobile ? "48px" : "auto",
              WebkitTapHighlightColor: "transparent",
            }}>
              ▸ {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CHAT CONTENT
// ═════════════════════════════════════════════════════════════════════════════

function ChatContent({ news, isMobile }: { news: NewsItem[]; isMobile: boolean }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([{
    role: "assistant",
    content: "Selamat datang. Saya siap mengkurasi dan menganalisis berita untuk Anda.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  const sendMessage = useCallback(async (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    const userMsg: ChatMsg = { role: "user", content: q };
    setMsgs(prev => [...prev, userMsg]);
    setLoading(true);

    const ctx = news.slice(0, 30).map(n =>
      `[${n.source}][${n.label}] ${n.title}${n.summary ? ` — ${n.summary.slice(0, 120)}` : ""}`
    ).join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...msgs, userMsg].map(m => ({ role: m.role, content: m.content })),
          newsContext: ctx,
        }),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { role: "assistant", content: data.reply || "Maaf, terjadi kesalahan." }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Koneksi ke AI gagal. Coba lagi." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, msgs, news]);

  useEffect(() => {
    _globalSend = sendMessage;
    return () => { _globalSend = null; };
  }, [sendMessage]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "8px 14px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "8px",
        flexShrink: 0, background: "var(--bg-1)",
      }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--green)" }} />
        <span style={{ color: "var(--green)", fontSize: "11px", letterSpacing: "1.5px" }}>AI CURATOR</span>
      </div>

      {/* Messages */}
      <div ref={msgsRef} style={{
        flex: 1, overflowY: "auto",
        padding: "14px",
        display: "flex", flexDirection: "column", gap: "10px",
        scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent",
      }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "90%",
            background: m.role === "user" ? "var(--bg-3)" : "var(--bg-2)",
            borderLeft: m.role === "assistant" ? "2px solid var(--green-dim)" : "none",
            padding: isMobile ? "11px 14px" : "8px 11px",
            fontSize: isMobile ? "14px" : "11px",
            lineHeight: "1.65",
            color: m.role === "user" ? "var(--text-1)" : "var(--text-0)",
            whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)",
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: "flex-start", background: "var(--bg-2)",
            borderLeft: "2px solid var(--green-dim)",
            padding: isMobile ? "11px 14px" : "8px 11px",
            fontSize: isMobile ? "14px" : "11px",
            color: "var(--text-3)", fontStyle: "italic", fontFamily: "var(--font-sans)",
          }}>
            menganalisis...
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div style={{
        padding: "10px 14px 0",
        display: "flex", gap: "6px",
        overflowX: "auto", scrollbarWidth: "none",
        flexShrink: 0,
      }}>
        {QUICK_PROMPTS.slice(0, isMobile ? 2 : 3).map(p => (
          <button key={p} onClick={() => sendMessage(p)} style={{
            background: "var(--bg-2)", border: "1px solid var(--border)",
            color: "var(--text-2)",
            padding: isMobile ? "9px 12px" : "4px 9px",
            fontSize: isMobile ? "12px" : "10px",
            whiteSpace: "nowrap", flexShrink: 0,
            fontFamily: "var(--font-mono)",
            minHeight: isMobile ? "44px" : "auto",
            WebkitTapHighlightColor: "transparent",
          }}>{p}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px", display: "flex", flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Tanya atau minta kurasi berita..."
          style={{
            flex: 1,
            background: "var(--bg-2)", border: "1px solid var(--border)", borderRight: "none",
            color: "var(--text-0)",
            padding: isMobile ? "14px 12px" : "8px 10px",
            fontSize: isMobile ? "16px" : "11px",
            outline: "none", fontFamily: "var(--font-mono)",
            minHeight: isMobile ? "52px" : "auto",
          }}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
          background: input.trim() && !loading ? "var(--gold)" : "var(--bg-3)",
          border: "1px solid var(--border)",
          color: input.trim() && !loading ? "#000" : "var(--text-3)",
          padding: "0 18px",
          fontSize: isMobile ? "13px" : "10px",
          letterSpacing: "1px", fontWeight: 600, flexShrink: 0,
          fontFamily: "var(--font-mono)",
          minHeight: isMobile ? "52px" : "auto",
          WebkitTapHighlightColor: "transparent",
        }}>
          KIRIM
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STATUS BAR
// ═════════════════════════════════════════════════════════════════════════════

function StatusBar({ news }: { news: NewsItem[] }) {
  return (
    <div style={{
      background: "var(--gold)", padding: "3px 14px",
      display: "flex", alignItems: "center", gap: "16px", flexShrink: 0,
    }}>
      <span style={{ color: "#000", fontSize: "10px", fontWeight: 600, letterSpacing: "1px" }}>● LIVE</span>
      <span style={{ color: "#3a2800", fontSize: "10px" }}>
        {news.length} berita · {Array.from(new Set(news.map(n => n.source))).length} sumber
      </span>
      <span style={{ marginLeft: "auto", color: "#3a2800", fontSize: "10px" }}>DIPERBARUI SETIAP 10 MENIT</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function Terminal() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeCat, setActiveCat] = useState<Cat>("all");
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);         // mobile bottom sheet
  const [rightPane, setRightPane] = useState<"detail" | "chat">("detail"); // desktop

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(data.items || []);
      setLastRefresh(new Date());
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const filtered = activeCat === "all" ? news : news.filter(n => n.category === activeCat);
  const counts = news.reduce<Record<string, number>>((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1; return acc;
  }, {});

  const handleSelectNews = (item: NewsItem) => {
    setSelectedItem(item);
    if (isMobile) setSheet("detail");
    else setRightPane("detail");
  };

  const handleAskAI = (q: string) => {
    if (isMobile) setSheet("chat");
    else setRightPane("chat");
    triggerAIChat(q);
  };

  // ── MOBILE: fixed viewport + bottom sheet overlay ─────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "var(--bg-0)" }}>
        <TopBar count={news.length} lastRefresh={lastRefresh} onRefresh={fetchNews} loading={loading} isMobile />
        <CategoryTabs
          active={activeCat}
          onChange={(c) => { setActiveCat(c); setSelectedItem(null); setSheet(null); }}
          counts={counts}
          isMobile
        />

        {/* News list — scrolls freely, never affected by sheet */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && news.length === 0 ? (
            <div style={{ padding: "60px 16px", textAlign: "center", color: "var(--text-3)", letterSpacing: "2px", fontSize: "12px" }}>
              MEMUAT BERITA...
            </div>
          ) : (
            <>
              {filtered.map((item) => (
                <NewsRow
                  key={item.id}
                  item={item}
                  selected={selectedItem?.id === item.id}
                  onClick={() => handleSelectNews(item)}
                  isMobile
                />
              ))}
              {/* AI Chat entry point at bottom of list */}
              <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
                <button onClick={() => setSheet("chat")} style={{
                  width: "100%", background: "var(--bg-2)",
                  border: "1px solid var(--border)", color: "var(--green)",
                  padding: "14px", fontSize: "13px", letterSpacing: "1px",
                  fontFamily: "var(--font-mono)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  WebkitTapHighlightColor: "transparent",
                }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                  BUKA AI CURATOR
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom sheet — rendered with position:fixed so it never disrupts scroll */}
        {sheet !== null && (
          <>
            {/* Dim backdrop — tap to close */}
            <div
              onClick={() => setSheet(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 10 }}
            />

            {/* Sheet panel */}
            <div style={{
              position: "fixed",
              left: 0, right: 0, bottom: 0,
              height: "85dvh",
              background: "var(--bg-1)",
              borderTop: "2px solid var(--gold)",
              zIndex: 20,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}>
              {/* Sheet header with tab switcher + close button */}
              <div style={{
                padding: "10px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-2)",
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", gap: "20px" }}>
                  <button
                    onClick={() => setSheet("detail")}
                    disabled={!selectedItem}
                    style={{
                      background: "transparent", border: "none",
                      borderBottom: sheet === "detail" ? "2px solid var(--gold)" : "2px solid transparent",
                      color: sheet === "detail" ? "var(--gold)" : !selectedItem ? "var(--text-3)" : "var(--text-2)",
                      padding: "4px 0", paddingBottom: "6px",
                      fontSize: "11px", letterSpacing: "1px",
                      fontFamily: "var(--font-mono)",
                      cursor: selectedItem ? "pointer" : "default",
                    }}>
                    ▸ DETAIL
                  </button>
                  <button
                    onClick={() => setSheet("chat")}
                    style={{
                      background: "transparent", border: "none",
                      borderBottom: sheet === "chat" ? "2px solid var(--green)" : "2px solid transparent",
                      color: sheet === "chat" ? "var(--green)" : "var(--text-2)",
                      padding: "4px 0", paddingBottom: "6px",
                      fontSize: "11px", letterSpacing: "1px",
                      fontFamily: "var(--font-mono)",
                    }}>
                    ◈ AI CURATOR
                  </button>
                </div>
                <button
                  onClick={() => setSheet(null)}
                  style={{
                    background: "transparent", border: "1px solid var(--border)",
                    color: "var(--text-1)", padding: "0 14px",
                    height: "36px", fontSize: "14px",
                    fontFamily: "var(--font-mono)",
                    WebkitTapHighlightColor: "transparent",
                  }}>
                  ✕
                </button>
              </div>

              {/* Sheet scrollable content */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {sheet === "detail" && selectedItem && (
                  <DetailContent item={selectedItem} onAskAI={handleAskAI} isMobile />
                )}
                {sheet === "chat" && (
                  <ChatContent news={news} isMobile />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── TABLET / DESKTOP: fixed height, side-by-side columns ─────────────────
  const rightColWidth = bp === "desktop" ? "400px" : "340px";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar count={news.length} lastRefresh={lastRefresh} onRefresh={fetchNews} loading={loading} isMobile={false} />
      <CategoryTabs active={activeCat} onChange={setActiveCat} counts={counts} isMobile={false} />

      <div style={{ display: "grid", gridTemplateColumns: `1fr ${rightColWidth}`, flex: 1, minHeight: 0 }}>
        {/* Left: news list */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", overflow: "hidden" }}>
          {loading && news.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", letterSpacing: "2px", fontSize: "11px" }}>
              MEMUAT BERITA...
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.map(item => (
                <NewsRow key={item.id} item={item} selected={selectedItem?.id === item.id} onClick={() => handleSelectNews(item)} isMobile={false} />
              ))}
            </div>
          )}
        </div>

        {/* Right: tabbed detail + chat */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg-1)", flexShrink: 0 }}>
            {(["detail", "chat"] as const).map(pane => (
              <button key={pane} onClick={() => setRightPane(pane)} style={{
                flex: 1, background: rightPane === pane ? "var(--bg-0)" : "transparent",
                border: "none",
                borderBottom: rightPane === pane ? "2px solid var(--gold)" : "2px solid transparent",
                color: rightPane === pane ? "var(--gold)" : "var(--text-2)",
                padding: "8px", fontSize: "10px", letterSpacing: "1.5px",
                fontFamily: "var(--font-mono)",
              }}>
                {pane === "detail" ? "▸ DETAIL BERITA" : "◈ AI CURATOR"}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {rightPane === "detail" ? (
              selectedItem ? (
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <DetailContent item={selectedItem} onAskAI={handleAskAI} isMobile={false} />
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px", color: "var(--text-3)", fontSize: "11px" }}>
                  <div style={{ fontSize: "26px", opacity: 0.2 }}>◈</div>
                  <div>Pilih berita untuk membaca detail</div>
                </div>
              )
            ) : (
              <ChatContent news={news} isMobile={false} />
            )}
          </div>
        </div>
      </div>

      <StatusBar news={news} />
    </div>
  );
}
