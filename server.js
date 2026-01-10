import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) console.warn("WARNING: OPENAI_API_KEY is not set. AI calls will fail.");

const client = new OpenAI({ apiKey });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function cleanStr(x) {
  if (x === null || x === undefined) return "";
  return String(x).trim();
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}$/);
    if (m) return JSON.parse(m[0]);
    throw new Error("JSON parse failed");
  }
}

async function jsonChat(system, user) {
  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.85,
    max_tokens: 1800, // UZUN cevaplar için
  });

  const txt = resp.choices?.[0]?.message?.content || "{}";
  return safeJsonParse(txt);
}

app.post("/api/helin", async (req, res) => {
  try {
    const birthDate = cleanStr(req.body?.birthDate);
    const birthPlace = cleanStr(req.body?.birthPlace);

    // boşsa null
    const birthTimeRaw = req.body?.birthTime;
    const birthTime = birthTimeRaw ? cleanStr(birthTimeRaw) : null;

    if (!birthDate || !birthPlace) {
      return res.status(400).json({ error: "birthDate ve birthPlace zorunlu." });
    }

    const system =
      "Sen Tatlı Cadı Helin'sin: tatlı ama ciddi, güven veren bir astroloji rehberi.\n" +
      "Kesin hüküm kurma; olasılık dili kullan. Tıbbi/hukuki/finansal kesin tavsiye verme.\n" +
      "Üslup: sıcak, net, motivasyonlu ama abartısız.\n" +
      "SADECE geçerli JSON üret. JSON dışında hiçbir şey yazma.";

    const user =
      `Doğum Tarihi: ${birthDate}\n` +
      `Doğum Saati: ${birthTime ? birthTime : "Bilinmiyor"}\n` +
      `Doğum Yeri: ${birthPlace}\n\n` +
      "Aşağıdaki JSON formatında cevap ver (Türkçe):\n" +
      "{\n" +
      '  "profile": { "sun_sign": "...", "moon_sign": "...", "rising_sign": "...", "tone_tags": ["...","...","..."] },\n' +
      '  "monthly": {\n' +
      '    "summary": "...",\n' +
      '    "love": "...",\n' +
      '    "money": "...",\n' +
      '    "mood": "...",\n' +
      '    "career": "...",\n' +
      '    "health": "...",\n' +
      '    "social": "...",\n' +
      '    "rituals": ["...","...","..."],\n' +
      '    "warnings": ["...","...","...","..."],\n' +
      '    "lucky_days": ["...","...","...","...","...","..."]\n' +
      "  },\n" +
      '  "summary": "tek cümlelik çok kısa özet"\n' +
      "}\n\n" +
      "Kurallar:\n" +
      "- monthly.summary EN AZ 6-10 cümle, paragraf paragraf.\n" +
      "- love/money/mood/career/health/social her biri EN AZ 7-10 cümle (somut öneri + küçük plan + örnek).\n" +
      "- rituals 3 madde: uygulanabilir mini ritüel (nefes, yazma, küçük alışkanlık).\n" +
      "- warnings 4 madde: net ve kısa.\n" +
      "- lucky_days 6 madde: gün ismi veya tarih aralığı.\n" +
      "- Doğum saati bilinmiyorsa rising_sign = \"Bilinmiyor\" ve love/money/career içinde 1-2 cümleyle bunun etkisini açıkla.\n" +
      "- Aynı cümleyi tekrar etme, dolu dolu yaz.\n";

    const out = await jsonChat(system, user);
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/fatih", async (req, res) => {
  try {
    const dream = cleanStr(req.body?.dream);
    const profile = req.body?.profile || null;

    if (!dream) return res.status(400).json({ error: "dream zorunlu." });

    const system =
      "Sen Rüya Yorumcusu Fatih'sin: gizemli ama anlaşılır; kısa değil, DERİNLİKLİ ve detaylı konuşursun.\n" +
      "Kesin kehanet gibi konuşma; olasılık dili kullan.\n" +
      "Tetikleyici/tehlikeli yönlendirme yapma. Kişisel farkındalık odaklı ol.\n" +
      "SADECE geçerli JSON üret. JSON dışında hiçbir şey yazma.";

    const profLine = profile
      ? `Kullanıcı profili (Helin): güneş=${profile.sun_sign || "?"}, ay=${profile.moon_sign || "?"}, yükselen=${profile.rising_sign || "?"}`
      : "Kullanıcı profili: yok";

    const user =
      `${profLine}\n\n` +
      `Rüya:\n${dream}\n\n` +
      "Aşağıdaki JSON formatında cevap ver (Türkçe):\n" +
      "{\n" +
      '  "symbols": [\n' +
      '    {"symbol":"...", "meaning":"..."},\n' +
      '    {"symbol":"...", "meaning":"..."},\n' +
      '    {"symbol":"...", "meaning":"..."},\n' +
      '    {"symbol":"...", "meaning":"..."},\n' +
      '    {"symbol":"...", "meaning":"..."},\n' +
      '    {"symbol":"...", "meaning":"..."}\n' +
      "  ],\n" +
      '  "theme": "...",\n' +
      '  "interpretation": "...",\n' +
      '  "advice": ["...","...","...","...","..."],\n' +
      '  "astro_link": "profil varsa 2-3 cümle bağ kur; yoksa boş string"\n' +
      "}\n\n" +
      "Kurallar:\n" +
      "- theme 3-5 cümle.\n" +
      "- symbols en az 6 adet; meaning her biri 2-4 cümle.\n" +
      "- interpretation EN AZ 16-24 cümle ve 3 bölüm olsun:\n" +
      "  (1) Genel tema ve duygu, (2) Semboller ve bilinçaltı mesaj, (3) Günlük hayata yansıma.\n" +
      "- advice 5 madde: çok uygulanabilir, net.\n" +
      "- Astro profil varsa astro_link 2-3 cümle.\n" +
      "- Tekrar yapma, dolu dolu yaz.\n";

    const out = await jsonChat(system, user);
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
