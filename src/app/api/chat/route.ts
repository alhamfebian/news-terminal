// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, newsContext } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const systemPrompt = `Kamu adalah AI kurator berita untuk sebuah terminal berita pribadi yang fokus pada industri makanan, ekonomi global, dan geopolitik.

Peranmu:
- Membantu pengguna memahami dan mengkurasi berita yang sedang tampil di terminal
- Memberikan analisis singkat, tajam, dan relevan seperti analis senior
- Menjawab dalam Bahasa Indonesia kecuali ditanya dalam bahasa lain
- Format jawaban: padat, poin-poin pendek, tidak bertele-tele
- Bisa mencari koneksi antar berita, dampak ekonomi, atau konteks geopolitik

Berita yang sedang tersedia di terminal hari ini:
${newsContext || "Tidak ada berita tersedia saat ini."}

Panduan:
- Jika ditanya soal berita tertentu, berikan analisis mendalam
- Jika diminta kurasi, pilihkan berita terpenting dan jelaskan mengapa
- Jika ditanya dampak ke Indonesia, selalu sertakan perspektif lokal
- Gunakan data dan angka jika tersedia dari berita`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    return NextResponse.json({ reply: text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
